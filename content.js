// 드래그한 문장을 감지하여 처리
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('selectionchange', handleSelectionChange);

let activeTable = null; // 현재 활성화된 테이블 상태

// 마우스 업 이벤트: 선택된 텍스트로 동적 테이블 생성
function handleMouseUp() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length === 0) return; // 선택된 텍스트가 없으면 종료

    removeExistingTable();
    createDynamicTable(selectedText.split(/\s+/));
}

// 선택 상태 변경 이벤트: 선택 해제 시 테이블 제거
function handleSelectionChange() {
    const selection = window.getSelection();
    if (selection.isCollapsed) removeExistingTable();
}

// 기존 동적 테이블 제거
function removeExistingTable() {
    if (activeTable) {
        activeTable.dispatchEvent(new Event('remove'));
        activeTable.remove();
        activeTable = null;
    }
}

// 선택된 텍스트의 위치 계산
function getSelectionRect() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return { left: 100, top: 100, width: 200, height: 50 };

    try {
        const range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();

        // boundingRect 유효성 확인 및 대체 처리
        while ((!rect || rect.width <= 0 || rect.height <= 0) && range.startContainer) {
            let parentElement = range.startContainer.nodeType === Node.TEXT_NODE 
                ? range.startContainer.parentElement 
                : range.startContainer;

            if (!parentElement) return { left: 100, top: 100, width: 200, height: 50 };
            rect = parentElement.getBoundingClientRect();
        }

        if (rect && rect.width > 0 && rect.height > 0) {
            return {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height,
            };
        }
    } catch (error) {
        console.error("getSelectionRect에서 예외 발생:", error);
    }

    return { left: 100, top: 100, width: 200, height: 50 };
}

// 동적 테이블(AI 기반 단어로 셀 수정 필요 -> 현재 작성된 내용 필요 없음)
function createDynamicTable(words) {
    if (!words || words.length === 0) return;

    const rect = getSelectionRect();
    const wordData = words.map(word => ({
        word,
        meaning: `${word}의 뜻이 매우 길어질 경우를 대비한 줄 바꿈 처리`,
        synonyms: [
            { word: `${word}_syn1`, meaning: `${word}의 유의어1의 뜻이 매우 길어질 경우를 대비한 줄 바꿈 처리` },
            { word: `${word}_syn2`, meaning: `${word}의 유의어2의 뜻` },
            { word: `${word}_syn3`, meaning: `${word}의 유의어3의 뜻` },
        ],
    }));

    const tableContainer = document.createElement('div');
    tableContainer.id = 'dynamic-table-container';
    tableContainer.style.position = 'absolute';
    tableContainer.style.left = `${rect.left}px`;
    tableContainer.style.top = `${rect.top - rect.height - 15}px`;
    tableContainer.style.backgroundColor = 'white';
    tableContainer.style.border = 'none';
    tableContainer.style.padding = '10px';
    tableContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    tableContainer.style.zIndex = '9999';
    tableContainer.style.overflow = 'hidden';
    tableContainer.style.width = '700px';
    tableContainer.style.height = '250px';

    const tableWrapper = document.createElement('div');
    const tableWidth = 680;
    const tableMargin = (700 - tableWidth) / 2;
    tableWrapper.style.display = 'flex';
    tableWrapper.style.transition = 'transform 0.3s ease-in-out';
    tableWrapper.style.width = `${(tableWidth + tableMargin * 2) * wordData.length}px`;
    tableWrapper.style.height = '150px';
    tableWrapper.style.marginTop = '26px';

    tableContainer.appendChild(tableWrapper);
    document.body.appendChild(tableContainer);
    activeTable = tableContainer;

    const wordCellWidth = tableWidth * (1 / 4);
    const meaningCellWidth = tableWidth * (3 / 4);

    wordData.forEach(currentWord => {
        const table = document.createElement('table');
        table.style.borderCollapse = 'separate';
        table.style.width = `${tableWidth}px`;
        table.style.height = '120px';
        table.style.margin = `0 ${tableMargin}px`;
        table.style.flexShrink = '0';
        table.cellSpacing = '5';

        const rows = [
            { word: currentWord.word, meaning: currentWord.meaning },
            ...currentWord.synonyms,
        ];

        rows.forEach((rowData, index) => {
            const row = table.insertRow();

            const wordCell = row.insertCell();
            wordCell.textContent = rowData.word;
            wordCell.style.border = '1px solid black';
            wordCell.style.padding = '10px';
            wordCell.style.textAlign = 'center';
            wordCell.style.fontSize = '14px';
            wordCell.style.borderRadius = '6px';
            wordCell.style.backgroundColor = index === 0 ? '#e0e0e0' : '#ffffff';
            wordCell.style.wordWrap = 'break-word';
            wordCell.style.whiteSpace = 'normal';
            wordCell.style.width = `${wordCellWidth}px`;

            const meaningCell = row.insertCell();
            meaningCell.textContent = rowData.meaning;
            meaningCell.style.border = '1px solid black';
            meaningCell.style.padding = '10px';
            meaningCell.style.textAlign = 'center';
            meaningCell.style.fontSize = '14px';
            meaningCell.style.borderRadius = '6px';
            meaningCell.style.backgroundColor = index === 0 ? '#e0e0e0' : '#ffffff';
            meaningCell.style.wordWrap = 'break-word';
            meaningCell.style.whiteSpace = 'normal';
            meaningCell.style.width = `${meaningCellWidth}px`;
        });

        tableWrapper.appendChild(table);
    });

    let currentPage = 0;
    const totalPages = wordData.length;

    const scrollbar = document.createElement('input');
    scrollbar.type = 'range';
    scrollbar.min = '0';
    scrollbar.max = `${totalPages - 1}`;
    scrollbar.value = '0';
    scrollbar.step = '1';
    scrollbar.style.position = 'absolute';
    scrollbar.style.left = '10px';
    scrollbar.style.bottom = '15px';
    scrollbar.style.width = '680px';
    scrollbar.style.zIndex = '10000';

    tableContainer.appendChild(scrollbar);

    scrollbar.addEventListener('input', (event) => {
        currentPage = parseInt(event.target.value, 10);
        tableWrapper.style.transform = `translateX(-${currentPage * (tableWidth + tableMargin * 2)}px)`;
    });

    tableContainer.addEventListener('wheel', (event) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? 1 : -1;
        const newPage = currentPage + direction;

        if (newPage >= 0 && newPage < totalPages) {
            currentPage = newPage;
            tableWrapper.style.transform = `translateX(-${currentPage * (tableWidth + tableMargin * 2)}px)`;
            scrollbar.value = currentPage;
        }
    });
}
