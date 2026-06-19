"""
RAG generation chain that feeds retrieved context to the LLM
and produces a citation-grounded answer.
"""

from typing import List

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

from backend.app.configuration.app_config import config
from backend.app.rag_pipeline.answer_generation.prompt_templates import (
    SYSTEM_PROMPT,
    USER_PROMPT_TEMPLATE,
)


class RAGGenerationChain:
    """
    Builds and executes the LLM generation chain.
    Supports Ollama (local), Groq, and OpenAI providers.
    Takes query + retrieved context, returns answer with citations.
    """

    def __init__(self):
        self.llm, self.fallback_llm = self._create_llm_with_fallback()
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            ("user", USER_PROMPT_TEMPLATE),
        ])

        self.chain = (
            RunnablePassthrough()
            | self.prompt
            | self.llm
            | StrOutputParser()
        )
        if self.fallback_llm:
            self.fallback_chain = (
                RunnablePassthrough()
                | self.prompt
                | self.fallback_llm
                | StrOutputParser()
            )
        else:
            self.fallback_chain = None

    def _create_llm(self, api_key: str = None):
        provider = config.llm_provider

        if provider == "groq":
            from langchain_groq import ChatGroq
            return ChatGroq(
                api_key=api_key or config.groq_api_key,
                model=config.groq_model,
                temperature=config.llm_temperature,
                max_tokens=config.llm_max_tokens,
            )

        elif provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=config.openai_api_key,
                model=config.openai_model,
                temperature=config.llm_temperature,
                max_tokens=config.llm_max_tokens,
            )

        else:
            try:
                from langchain_ollama import ChatOllama
            except ImportError:
                from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=config.llm_model,
                base_url=config.llm_base_url,
                temperature=config.llm_temperature,
                num_predict=config.llm_max_tokens,
            )

    def _create_llm_with_fallback(self):
        """Returns primary LLM and fallback LLM (second Groq key)."""
        primary = self._create_llm(config.groq_api_key)
        fallback = None
        if config.groq_fallback_api_key:
            fallback = self._create_llm(config.groq_fallback_api_key)
        return primary, fallback

    def format_context(self, chunks: List[dict]) -> str:
        """
        Formats retrieved chunks into a numbered context string for the LLM.
        Each chunk gets a source number for citation mapping.
        """
        context_parts = []
        self.source_map = {}

        for i, chunk in enumerate(chunks):
            source_number = i + 1
            source_info = chunk.get("metadata", {})

            source_name = source_info.get("file_name", source_info.get("source", "Unknown"))
            page = source_info.get("page_number", "")
            chunk_id = chunk.get("chunk_id", "")

            source_ref = f"[{source_number}] {source_name}"
            if page:
                source_ref += f" - Page {page}"

            self.source_map[source_number] = {
                "source": source_name,
                "page": page,
                "chunk_id": chunk_id,
                "reference": source_ref,
            }

            context_parts.append(
                f"Source [{source_number}]:\n{chunk['text']}\n"
            )

        return "\n---\n".join(context_parts)

    def generate(
        self,
        query: str,
        chunks: List[dict],
    ) -> dict:
        """
        Generates an answer from query and retrieved chunks.
        Tries primary Groq key first; on rate limit, falls back to secondary key.
        Returns the answer text and source citations.
        """
        context = self.format_context(chunks)

        chains_to_try = [("primary", self.chain)]
        if self.fallback_chain:
            chains_to_try.append(("fallback", self.fallback_chain))

        last_error = None
        for name, chain in chains_to_try:
            try:
                response = chain.invoke({
                    "context": context,
                    "question": query,
                })
                return {
                    "answer": response,
                    "sources": list(self.source_map.values()),
                    "source_count": len(self.source_map),
                }
            except Exception as e:
                last_error = e
                err = str(e).lower()
                if ("rate_limit" in err or "429" in err or "413" in err) and name == "primary":
                    continue
                raise

        raise last_error

    def generate_stream(self, query: str, chunks: List[dict]):
        """
        Generates a streaming response token by token.
        Yields answer chunks and final sources.
        """
        context = self.format_context(chunks)

        stream = self.chain.stream({
            "context": context,
            "question": query,
        })

        for token in stream:
            yield {"type": "token", "content": token}

        yield {
            "type": "sources",
            "content": list(self.source_map.values()),
        }
