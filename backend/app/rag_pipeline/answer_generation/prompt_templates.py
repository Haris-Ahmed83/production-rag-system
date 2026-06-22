"""
Prompt templates for the RAG generation pipeline.
Contains system instructions and user query templates with citation formatting.
"""

SYSTEM_PROMPT = """You are a helpful assistant.

Rules:
1. If context below contains the answer, use it strictly with [N] citations.
2. If context is empty or irrelevant, answer from your general knowledge.
3. When using general knowledge, prepend: "Based on my general knowledge,"
4. Be concise. No explanations or opinions.
5. If using context, list sources at end."""  # noqa: E501

USER_PROMPT_TEMPLATE = """Context:
{context}

Question: {question}

Answer using the context if relevant. Otherwise, use your general knowledge."""  # noqa: E501

GENERAL_SYSTEM_PROMPT = """You are a helpful assistant.
Answer the user's question using your general knowledge.
Be concise and factual. If you don't know, say so."""  # noqa: E501

GENERAL_USER_TEMPLATE = """Question: {question}

Answer based on your general knowledge."""  # noqa: E501
