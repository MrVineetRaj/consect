import { aiHubResourceRepository } from "../db/repository/ai-hub-resource.js";

class CronHandlers {
  async reprocessEmbeddings() {
    const resources =
      await aiHubResourceRepository.getUnEmbeddedResourcesByStatus();

    await Promise.all(
      [...resources.failed, ...resources.pending].map((item) => {
        void fetch("http://localhost:8000/embed_document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        }).catch(async () => {
          return aiHubResourceRepository.updateResourceDetails({
            resourceId: item!.id,
            pointIds: [],
            status: "failed",
          });
        });
        return aiHubResourceRepository.updateResourceDetails({
          resourceId: item!.id,
          pointIds: [],
          status: "failed",
        });
      }),
    );
  }
}

export const cronHandlers = new CronHandlers();
