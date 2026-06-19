from typing import List

from backend.app.configuration.app_config import config


class ResultRanker:
    """
    Re-ranks retrieved chunks using a cross-encoder model via transformers.
    The cross-encoder processes each query-chunk pair jointly,
    producing a more accurate relevance score than bi-encoder cosine similarity.
    """

    def __init__(self):
        self.model_name = config.reranker_model
        self._tokenizer = None
        self._model = None

    @property
    def model(self):
        if self._model is None:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self._model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name,
                torch_dtype="auto",
            )
        return self._tokenizer, self._model

    def rerank(
        self,
        query: str,
        chunks: List[dict],
        top_k: int = None,
    ) -> List[dict]:
        if not chunks:
            return []

        if top_k is None:
            top_k = config.reranker_top_k

        tokenizer, model = self.model
        pairs = [[query, chunk["text"]] for chunk in chunks]
        inputs = tokenizer(
            pairs,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        outputs = model(**inputs)
        scores = outputs.logits.squeeze(-1).detach().numpy()

        scored_chunks = []
        for chunk, score in zip(chunks, scores):
            scored_chunks.append({**chunk, "reranker_score": float(score)})

        scored_chunks.sort(key=lambda x: x["reranker_score"], reverse=True)
        return scored_chunks[:top_k]
