import {completion} from "./llmService.ts";

export interface ModelConfig {
    prompt: string;
    model: string,
    temperature: number,
    top_p: number,
    headers: Record<string, string>,
    extra: object
}

export class SimpleModelConfig implements ModelConfig {
    constructor(public prompt: string,
                public headers: Record<string, string>,
                public model: string = 'qwen-max-latest',
                public temperature: number = 1,
                public top_p: number = 1,
                public extra: object = {}) {
        this.prompt = prompt;
        this.model = model;
        this.temperature = temperature;
        this.top_p = top_p;
        this.headers = headers;
        this.extra = extra;
    }
}

export class TranslationService {
    private readonly first: ModelConfig;
    private readonly second: ModelConfig;

    constructor(first: ModelConfig, second: ModelConfig) {
        this.first = first;
        this.second = second;
    }

    async translate(text: string): Promise<{ candidate1: string, candidate2: string }> {
        const u = 'Translate the following passage: '

        const m1 = [{ role: 'system', content: this.first.prompt }, { role: 'user', content: u + text }];
        const m2 = [{ role: 'system', content: this.second.prompt }, { role: 'user', content: u + text }];

        const response1 = await completion(this.first.model, m1, this.first.headers, this.first.temperature, this.first.top_p, this.first.extra);
        const response2 = await completion(this.second.model, m2, this.second.headers, this.second.temperature, this.second.top_p, this.second.extra);

        if (response1 === undefined || response2 === undefined) {
            throw new Error("Translation service failed to produce valid responses.");
        }

        return {
            candidate1: response1.choices?.[0]?.message?.content,
            candidate2: response2.choices?.[0]?.message?.content
        };
    }
}
