// OpenAI API를 호출하여 데이터를 가져오는 함수
async function fetchSynonymsFromAPI(text) {
    const apiKey = "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"; // OpenAI API 키
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const messages = [
        { role: "system", content: "You are a helpful assistant designed to output JSON." },
        {
            role: "user",
            content: `
            아래 문장에서 대체 가능한 모든 요소(단어, 문구, 구문)를 찾고, 요소의 어절 수를 파악한다.
            대체 가능한 표현 오직 3개를 의미와 함께 반환

            기존 뜻은 문맥에 맞춰 파악한다.
            가능한 많은 수의 어절부터 분석한다. 출력은 입력 순서에 맞춘다.
            유의어 또는 대체 표현은 기존 요소보다 어휘의 수준을 높인다.
            의미는 구체적으로, 3개의 대체 표현이 모두 구분이 가도록 어감과 함께 적는다.

            <문장>
            ${text}

            <JSON 형식>
            [
                {
                    "기존 표현": "표현1",
                    "뜻": "표현1의 정의",
                    "대체 표현": [
                        { "표현": "대체 표현1-1", "뜻": "대체 표현1-1의 정의" },
                        { "표현": "대체 표현1-2", "뜻": "대체 표현1-2의 정의" },
                        { "표현": "대체 표현1-3", "뜻": "대체 표현1-3의 정의" }
                    ]
                }
            ]
            `
        }
    ];

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model: "gpt-4o-mini", messages }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API 호출 실패:", errorText); // 로그 추가
            throw new Error(`API 호출 실패: ${response.statusText}`);
        }

        const { choices } = await response.json();
        const content = choices[0].message.content.trim();
        console.log("API 응답 데이터:", content); // 로그 추가

        const jsonStartIndex = content.indexOf("[");
        const jsonEndIndex = content.lastIndexOf("]") + 1;

        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
            console.error("JSON 형식 데이터가 없습니다."); // 로그 추가
            throw new Error("JSON 형식을 포함하지 않은 응답입니다.");
        }

        const jsonString = content.substring(jsonStartIndex, jsonEndIndex);
        const parsedJSON = JSON.parse(jsonString);
        console.log("파싱된 JSON 데이터:", parsedJSON); // 로그 추가
        return parsedJSON;
    } catch (error) {
        console.error("OpenAI API 호출 오류:", error.message); // 로그 추가
        throw error;
    }
}

// 메시지 리스너 등록
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("메시지 수신:", message); // 로그 추가

    if (message.type === "FETCH_SYNONYMS") {
        fetchSynonymsFromAPI(message.text)
            .then((data) => {
                console.log("API 데이터 반환:", data); // 로그 추가
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                console.error("오류 반환:", error.message); // 로그 추가
                sendResponse({ success: false, error: error.message });
            });
        return true; // 비동기 응답을 위해 true 반환
    }
});

// (async () => {
//     try {
//         const testText = "남녀노소 불문하고 이 시대를 함께 살아가고 있는 대한민국 국민들의 소소한 이야기부터 말 못한 고민까지";
//         console.log("테스트 문장:", testText);

//         const synonyms = await fetchSynonymsFromAPI(testText);
//         console.log("유의어 데이터:", JSON.stringify(synonyms, null, 2));
//     } catch (error) {
//         console.error("테스트 중 오류:", error.message);
//     }
// })();
