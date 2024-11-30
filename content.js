// 드래그한 문장을 감지하여 처리
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("selectionchange", handleSelectionChange);

let activeIcon = null; // 현재 활성화된 아이콘 상태
let activeTable = null; // 현재 활성화된 테이블 상태

// 마우스 업 이벤트 처리
function handleMouseUp() {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
        removeExistingIcon();
        return;
    }

    const rect = getSelectionRect();
    if (rect) {
        showIconAtPosition(rect, selectedText); // 아이콘은 항상 표시
    }
}

// 선택 상태 변경 이벤트 처리
function handleSelectionChange() {
    const selection = window.getSelection();
    if (selection.isCollapsed) {
        removeExistingIcon();
    }
}

// 드래그한 문장의 위치 계산
function getSelectionRect() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        right: rect.right + window.scrollX,
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        height: rect.height,
    };
}

// 아이콘 표시
function showIconAtPosition(rect, selectedText) {
    if (activeIcon) {
        return;
    }

    const button = document.createElement("button");
    button.style.position = "absolute";
    button.style.left = `${rect.right}px`;
    button.style.top = `${rect.top - 4}px`;
    button.style.width = "32px";
    button.style.height = "32px";
    button.style.border = "none";
    button.style.padding = "0";
    button.style.background = "none";
    button.style.cursor = "pointer";
    button.style.zIndex = "9999";

    const icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("images/iconimage.png");
    icon.style.width = "100%";
    icon.style.height = "100%";
    button.appendChild(icon);

    button.addEventListener("click", () => {
        if (selectedText.length > 50) {
            removeExistingIcon();
            alert(`선택한 글자가 50자를 초과하였습니다. (${selectedText.length}자)`);
            return;
        }

        chrome.runtime.sendMessage(
            { type: "FETCH_SYNONYMS", text: selectedText },
            (response) => {
                if (response.success) {
                    removeExistingTable();
                    createDynamicTable(response.data);
                }
            }
        );
    });

    document.body.appendChild(button);
    activeIcon = button;
}

// 기존 아이콘 제거
function removeExistingIcon() {
    if (activeIcon) {
        activeIcon.remove();
        activeIcon = null;
    }
}

// 기존 테이블 제거
function removeExistingTable() {
    if (activeTable) {
        activeTable.remove();
        activeTable = null;
    }
}

function createDynamicTable(wordData) {
    removeExistingIcon();
    removeExistingTable();
    if (!wordData || wordData.length === 0) return;

    const rect = getSelectionRect();
    if (!rect) {
        return;
    }

    // 기본 컨테이너 및 테이블 크기
    const baseContainerHeight = 240;
    const baseTableHeight = 140;
    const tableWidth = 680;
    const tableMargin = (700 - tableWidth) / 2; 

    let additionalHeight = 0; // 긴 단어가 있을 경우 추가 높이

    // 긴 단어 확인
    let hasLongWord = false;
    wordData.forEach(currentWord => {
        if (currentWord["기존 표현"].length > 13) hasLongWord = true;
        currentWord["대체 표현"].forEach(synonym => {
            if (synonym["표현"].length > 13) hasLongWord = true;
        });
    });

    // 긴 단어가 있을 경우 하단 영역 확장
    if (hasLongWord) {
        additionalHeight = 60;
    }

    const containerHeight = baseContainerHeight + additionalHeight;
    const tableHeight = baseTableHeight + additionalHeight;

    // 컨테이너 생성
    const tableContainer = document.createElement("div");
    tableContainer.id = "dynamic-table-container";
    tableContainer.style.position = "absolute";
    tableContainer.style.left = `${rect.left}px`;
    tableContainer.style.top = `${rect.top + rect.height - (baseContainerHeight + 30 + additionalHeight)}px`;
    tableContainer.style.backgroundColor = "#F8F8FA";
    tableContainer.style.border = "none";
    tableContainer.style.borderRadius = "6px";
    tableContainer.style.padding = "10px";
    tableContainer.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    tableContainer.style.zIndex = "9999";
    tableContainer.style.overflow = "hidden";
    tableContainer.style.width = "700px";
    tableContainer.style.height = `${containerHeight}px`;
    tableContainer.style.fontFamily = "'Pretendard Variable'";


    // Exit 버튼 추가
    const exitButton = document.createElement("img");
    exitButton.src = chrome.runtime.getURL("images/exitimage.png");
    exitButton.alt = "Close";
    exitButton.style.position = "absolute";
    exitButton.style.width = "16px";
    exitButton.style.height = "16px";
    exitButton.style.objectFit = "contain";
    exitButton.style.cursor = "pointer";
    exitButton.style.zIndex = "10000";
    exitButton.style.right = `${tableMargin + 5}px`;
    exitButton.style.top = "15px";

    exitButton.addEventListener("click", () => {
        removeExistingTable();
    });

    tableContainer.appendChild(exitButton);

    // 테이블 래퍼 생성
    const tableWrapper = document.createElement("div");
    tableWrapper.style.display = "flex";
    tableWrapper.style.transition = "transform 0.3s ease-in-out";
    tableWrapper.style.width = `${(tableWidth + tableMargin * 2) * wordData.length}px`;
    tableWrapper.style.height = `${baseTableHeight}px`;
    tableWrapper.style.position = "absolute";
    tableWrapper.style.top = "40px";
    tableWrapper.style.left = "0";

    tableContainer.appendChild(tableWrapper);
    document.body.appendChild(tableContainer);
    activeTable = tableContainer;

    const wordCellWidth = tableWidth * (1 / 4);
    const meaningCellWidth = tableWidth * (3 / 4);

    wordData.forEach(currentWord => {
        const table = document.createElement("table");
        table.style.borderCollapse = "separate";
        table.style.width = `${tableWidth}px`;
        table.style.height = `${baseTableHeight}px`; // 기본 테이블 높이
        table.style.margin = `0 ${tableMargin}px`;
        table.style.flexShrink = "0";
        table.cellSpacing = "5";

        const rows = [
            { word: currentWord["기존 표현"], meaning: currentWord["뜻"] },
            ...currentWord["대체 표현"].map(synonym => ({
                word: synonym["표현"],
                meaning: synonym["뜻"]
            }))
        ];

        rows.forEach((rowData, index) => {
            const row = table.insertRow();

            const wordCell = row.insertCell();
            wordCell.textContent = rowData.word;
            wordCell.style.padding = "10px";
            wordCell.style.textAlign = "center";
            wordCell.style.fontSize = "14px";
            wordCell.style.fontWeight = "bold";
            wordCell.style.wordWrap = "break-word";
            wordCell.style.letterSpacing = "-0.025em";
            wordCell.style.whiteSpace = "normal";
            wordCell.style.width = `${wordCellWidth}px`;

            const meaningCell = row.insertCell();
            meaningCell.textContent = rowData.meaning;
            meaningCell.style.padding = "10px";
            meaningCell.style.paddingLeft = "15px";
            meaningCell.style.textAlign = "left";
            meaningCell.style.letterSpacing = "-0.025em";
            meaningCell.style.fontSize = "14px";
            meaningCell.style.wordWrap = "break-word";
            meaningCell.style.whiteSpace = "normal";
            meaningCell.style.width = `${meaningCellWidth}px`;

            switch (index) {
                case 0:
                    row.style.backgroundColor = "#3B3B3B";
                    wordCell.style.color = "#FFFFFF";
                    meaningCell.style.color = "#FFFFFF";
                    break;
                case 1:
                    row.style.backgroundColor = "#FFFFFF";
                    break;
                case 2:
                    row.style.backgroundColor = "#E9E9E9";
                    break;
                case 3:
                    row.style.backgroundColor = "#FFFFFF";
                    break;
                default:
                    row.style.backgroundColor = "#FFFFFF";
                    break;
            }
        });

        table.style.borderCollapse = "collapse";
        table.style.border = "none";

        tableWrapper.appendChild(table);
    });

    let currentPage = 0;
    const totalPages = wordData.length;

    const scrollbar = document.createElement("input");
    scrollbar.type = "range";
    scrollbar.min = "0";
    scrollbar.max = `${totalPages - 1}`;
    scrollbar.value = "0";
    scrollbar.step = "1";
    scrollbar.style.position = "absolute";
    scrollbar.style.left = "10px";
    scrollbar.style.bottom = "15px";
    scrollbar.style.width = "680px";
    scrollbar.style.zIndex = "10000";

    tableContainer.appendChild(scrollbar);

    scrollbar.addEventListener("input", (event) => {
        currentPage = parseInt(event.target.value, 10);
        tableWrapper.style.transform = `translateX(-${currentPage * (tableWidth + tableMargin * 2)}px)`;
    });

    tableContainer.addEventListener("wheel", (event) => {
        event.preventDefault();
        const direction = event.deltaY > 0 ? -1 : 1;
        const newPage = currentPage + direction;

        if (newPage >= 0 && newPage < totalPages) {
            currentPage = newPage;
            tableWrapper.style.transform = `translateX(-${currentPage * (tableWidth + tableMargin * 2)}px)`;
            scrollbar.value = currentPage;
        }
    });
}
