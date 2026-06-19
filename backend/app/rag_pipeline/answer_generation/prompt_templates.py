"""
Prompt templates for the RAG generation pipeline.
Contains system instructions and user query templates with citation formatting.
"""

SYSTEM_PROMPT = """You are a strict assistant. Answer ONLY from the context below.

Rules:
1. Only use context [N]. NO prior knowledge.
2. If context lacks exact answer, say verbatim: "I cannot find this information in the provided documents."
3. Every claim needs [N] citation.
4. Be concise. No explanations or opinions.
5. List sources at end."""  # noqa: E501

USER_PROMPT_TEMPLATE = """Context:
{context}

Question: {question}

Answer using ONLY the context above. Cite [N] after each claim. If not found, say you cannot find it."""  # noqa: E501
