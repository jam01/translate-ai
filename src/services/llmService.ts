import axios from 'axios';

export async function completion(model: string,
                                 messages: { role: string, content: string }[],
                                 headers: Record<string, string> = {},
                                 temperature: number = 1,
                                 top_p: number = 1,
                                 extra: object = {}): Promise<any | undefined> {
    const requestHeaders = {
        ...headers,
        'Content-Type': 'application/json'
    };

    const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    let url: string;
    if (model.toLowerCase().includes('qwen')) {
        url = QWEN_API_URL;
    } else if (model.toLowerCase().includes('openai')) {
        url = OPENAI_API_URL;
    } else {
        throw new Error(`Unsupported model: ${model}`);
    }

    try {
        const response = await axios.post(url, {
            model,
            messages,
            temperature,
            top_p,
            ...extra
        }, {
            headers: requestHeaders
        });
        return response.data;
    } catch (error) {
        console.error('Completion request failed:', error);
        return undefined;
    }
}
