import { QdrantClient } from "@qdrant/qdrant-js";
import { env } from "../../env.js";

type Distance = "Cosine" | "Euclid" | "Dot" | "Manhattan";

type Payload = Record<string, unknown>;

interface Embedding {
  id: string | number;
  vector: number[];
  payload?: Payload;
}

interface InitCollectionArgs {
  collection: string;
  /** Dimension of the vectors stored in this collection (e.g. 1536 for OpenAI text-embedding-3-small). */
  size: number;
  distance?: Distance;
}

interface CollectionArgs {
  collection: string;
}

interface CreateEmbeddingArgs {
  collection: string;
  embeddings: Embedding | Embedding[];
}

interface GetEmbeddingArgs {
  collection: string;
  ids: Array<string | number>;
  withVector?: boolean;
  withPayload?: boolean;
}

interface UpdateEmbeddingArgs {
  collection: string;
  id: string | number;
  /** New vector. Omit to keep the existing vector and only update the payload. */
  vector?: number[];
  payload?: Payload;
}

interface DeleteEmbeddingArgs {
  collection: string;
  ids: Array<string | number>;
}

interface SearchEmbeddingArgs {
  collection: string;
  /** Query vector to find nearest neighbours for. */
  vector: number[];
  limit?: number;
  offset?: number;
  /** Only return results scoring at or above this threshold. */
  scoreThreshold?: number;
  /** Optional payload filter to constrain the search. */
  filter?: Record<string, unknown>;
  withVector?: boolean;
  withPayload?: boolean;
}

type SearchRequest = Parameters<QdrantClient["search"]>[1];

interface UpdateCollectionArgs {
  collection: string;
  /** Partial collection settings to update (optimizers, params, hnsw, etc.). */
  config: Parameters<QdrantClient["updateCollection"]>[1];
}

class VectorDB {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({ url: env.QDRANT_URL });
  }

  // #region --- Collections ---

  /** Create a collection if it does not already exist. */
  async initCollection(args: InitCollectionArgs) {
    const exists = await this.collectionExists(args.collection);
    if (exists) return false;

    await this.client.createCollection(args.collection, {
      vectors: {
        size: args.size,
        distance: args.distance ?? "Cosine",
      },
    });
    return true;
  }

  async updateCollection(args: UpdateCollectionArgs) {
    return this.client.updateCollection(args.collection, args.config);
  }

  async deleteCollection(args: CollectionArgs) {
    return this.client.deleteCollection(args.collection);
  }

  async collectionExists(collection: string) {
    const { exists } = await this.client.collectionExists(collection);
    return exists;
  }

  // #endregion

  // #region --- Embeddings (points) ---

  /** Insert one or more embeddings. Existing points with the same id are overwritten. */
  async createEmbedding(args: CreateEmbeddingArgs) {
    const points = Array.isArray(args.embeddings)
      ? args.embeddings
      : [args.embeddings];

    return this.client.upsert(args.collection, {
      wait: true,
      points: points.map((point) => ({
        id: point.id,
        vector: point.vector,
        payload: point.payload ?? null,
      })),
    });
  }

  /** Retrieve stored embeddings by id. */
  async getEmbedding(args: GetEmbeddingArgs) {
    return this.client.retrieve(args.collection, {
      ids: args.ids,
      with_vector: args.withVector ?? true,
      with_payload: args.withPayload ?? true,
    });
  }

  /**
   * Update an existing embedding. When `vector` is provided the whole point is
   * re-upserted; otherwise only the payload is merged into the existing point.
   */
  async updateEmbedding(args: UpdateEmbeddingArgs) {
    if (args.vector) {
      return this.client.upsert(args.collection, {
        wait: true,
        points: [
          {
            id: args.id,
            vector: args.vector,
            payload: args.payload ?? null,
          },
        ],
      });
    }

    return this.client.setPayload(args.collection, {
      wait: true,
      payload: args.payload ?? {},
      points: [args.id],
    });
  }

  async deleteEmbedding(args: DeleteEmbeddingArgs) {
    return this.client.delete(args.collection, {
      wait: true,
      points: args.ids,
    });
  }

  /** Find the nearest stored embeddings to a query vector, ordered by score. */
  async searchEmbedding(args: SearchEmbeddingArgs) {
    const request: SearchRequest = {
      vector: args.vector,
      limit: args.limit ?? 10,
      with_vector: args.withVector ?? false,
      with_payload: args.withPayload ?? true,
    };

    if (args.offset !== undefined) request.offset = args.offset;
    if (args.scoreThreshold !== undefined)
      request.score_threshold = args.scoreThreshold;
    if (args.filter !== undefined)
      request.filter = args.filter as Exclude<
        SearchRequest["filter"],
        undefined
      >;

    return this.client.search(args.collection, request);
  }

  // #endregion
}

export const vectorDB = new VectorDB();
