import { pipeline, env } from '@xenova/transformers';
env.allowLocalModels = false;

async function testModel(modelName) {
    try {
        console.log("Testing " + modelName);
        await pipeline('image-segmentation', modelName);
        console.log(modelName + " loaded successfully!");
    } catch (e) {
        console.error(modelName + " failed:", e.message);
    }
}
testModel('Xenova/segformer-b0-finetuned-ade-512-512');
