export const SortableList = {
  name: 'SortableList',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'sortable_list' || trace.payload.name === 'sortable_list',

  render: ({ trace, element }) => {
    try {
      let { options, submitEvent } = trace.payload;
      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error(
          "Missing required input variables: options (non-empty array) or submitEvent"
        );
      }
      // 过滤掉 "None" 元素
      options = options.filter(item => item !== "None");

      // 状态数据：目标区域（上方）的槽位数量固定，与 options 数量一致，
      // 每个槽位初始为空，来源区域存放所有选项
      const totalSlots = options.length;
      let targetSlots = new Array(totalSlots).fill(null); // 若为 null 表示空槽位
      let sourceItems = [...options];

      // 创建整体容器，并加入两个区域和提交按钮
      const container = document.createElement("div");
      container.className = "sortable-container";

      const style = document.createElement("style");
      style.textContent = `
        .sortable-container {
          width: 100%;
          margin: 1rem auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: sans-serif;
        }
        .target-container, .source-container {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: center;
          align-items: center;
          min-height: 100px;
          border: 1px solid #ccc;
          padding: 10px;
          border-radius: 8px;
        }
        /* 虚线占位框 */
        .placeholder {
          width: 100px;
          height: 50px;
          border: 2px dashed #007AFF;
          border-radius: 8px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .placeholder::before {
          content: attr(data-index);
          position: absolute;
          top: 2px;
          left: 2px;
          font-weight: bold;
          opacity: 0.3;
          font-size: 0.8rem;
        }
        /* 按钮样式 */
        .option-btn {
          padding: 1rem;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: move;
          user-select: none;
          white-space: nowrap;
          min-width: 80px;
          text-align: center;
        }
        .dragging {
          opacity: 0.5;
        }
        .drop-indicator {
          outline: 2px dashed #FF4500;
        }
        .submit-btn {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: block;
          margin: 0 auto;
        }
        .submit-btn:disabled {
          background: #808080;
          cursor: not-allowed;
        }
      `;
      container.appendChild(style);

      // 创建 form 元素
      const formElement = document.createElement("form");

      // 创建两个区域
      const targetContainer = document.createElement("div");
      targetContainer.className = "target-container";
      const sourceContainer = document.createElement("div");
      sourceContainer.className = "source-container";

      formElement.appendChild(targetContainer);
      formElement.appendChild(sourceContainer);

      // 提交按钮
      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.className = "submit-btn";
      submitButton.textContent = "Submit";
      formElement.appendChild(submitButton);

      container.appendChild(formElement);
      element.appendChild(container);

      // 用于记录当前拖拽数据
      let draggedData = null;
      
      /* 渲染函数：根据当前状态重新绘制目标区域与来源区域 */

      function renderTarget() {
        targetContainer.innerHTML = "";
        // 遍历 targetSlots 数组，每个槽位按顺序显示
        targetSlots.forEach((item, index) => {
          if (item === null) {
            // 空槽位显示虚线占位框，显示序号（index+1）
            const placeholder = document.createElement("div");
            placeholder.className = "placeholder";
            placeholder.setAttribute("data-index", index + 1);
            placeholder.dataset.slotIndex = index;
            // 占位框允许接收拖拽
            placeholder.addEventListener("dragover", handleTargetDragOver);
            placeholder.addEventListener("dragleave", handleDragLeave);
            placeholder.addEventListener("drop", handleTargetDrop);
            targetContainer.appendChild(placeholder);
          } else {
            // 如果槽位已被填充，则显示按钮
            const btn = document.createElement("div");
            btn.className = "option-btn";
            btn.textContent = item;
            btn.draggable = true;
            btn.dataset.slotIndex = index;
            btn.addEventListener("dragstart", handleDragStart);
            btn.addEventListener("dragend", handleDragEnd);
            // 也允许对按钮进行拖拽重排（可拖到空槽位上）
            btn.addEventListener("dragover", handleTargetDragOver);
            btn.addEventListener("dragleave", handleDragLeave);
            btn.addEventListener("drop", handleTargetDrop);
            targetContainer.appendChild(btn);
          }
        });
      }

      function renderSource() {
        sourceContainer.innerHTML = "";
        sourceItems.forEach((item, index) => {
          const btn = document.createElement("div");
          btn.className = "option-btn";
          btn.textContent = item;
          btn.draggable = true;
          btn.dataset.sourceIndex = index;
          btn.addEventListener("dragstart", handleDragStart);
          btn.addEventListener("dragend", handleDragEnd);
          sourceContainer.appendChild(btn);
        });
      }

      // 初始渲染
      renderTarget();
      renderSource();

      /* 拖拽事件处理 */

      // 当拖拽开始时，记录拖拽对象、其来源（目标区域或来源区域）以及在数组中的索引
      function handleDragStart(e) {
        // 判断来源：dataset.sourceIndex 存在说明在来源区域；否则在目标区域
        const isSource = this.dataset.sourceIndex !== undefined;
        const isTarget = this.dataset.slotIndex !== undefined;
        draggedData = {
          item: this.textContent,
          origin: isSource ? "source" : "target",
          index: isSource ? parseInt(this.dataset.sourceIndex) : parseInt(this.dataset.slotIndex),
          element: this
        };
        this.classList.add("dragging");
        // 如果拖拽的是目标区域中的按钮，则立刻将其槽位置空并重新渲染，
        // 这样目标区域会显示对应的虚线占位框（便于后续“磁吸”放置）
        if (draggedData.origin === "target") {
          targetSlots[draggedData.index] = null;
          renderTarget();
        }
      }

      function handleDragEnd(e) {
        if (draggedData && draggedData.element) {
          draggedData.element.classList.remove("dragging");
        }
        draggedData = null;
      }

      // 目标区域拖拽：当鼠标移入时添加视觉提示
      function handleTargetDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add("drop-indicator");
      }
      function handleDragLeave(e) {
        e.currentTarget.classList.remove("drop-indicator");
      }

      // 目标区域 drop 处理：只接受放置在空槽位或已填充按钮上（相当于目标区内重新排序）
      function handleTargetDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove("drop-indicator");
        if (!draggedData) return;
        const dropIndex = parseInt(e.currentTarget.dataset.slotIndex);
        // 只允许放置到空槽位上（“磁吸”到最近的虚线占位框），否则忽略
        if (targetSlots[dropIndex] === null) {
          if (draggedData.origin === "source") {
            // 如果来自来源区域，则删除对应项
            sourceItems.splice(draggedData.index, 1);
          } else if (draggedData.origin === "target") {
            // 来自目标区域时，拖拽开始时已经置空原槽位
          }
          // 放置到目标槽位中
          targetSlots[dropIndex] = draggedData.item;
          renderTarget();
          renderSource();
        }
      }

      // 来源区域拖拽处理：来源区域整体也接收 drop 事件，
      // 实现按钮之间的重新排序或从目标区域拖回
      sourceContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        sourceContainer.classList.add("drop-indicator");
      });
      sourceContainer.addEventListener("dragleave", (e) => {
        sourceContainer.classList.remove("drop-indicator");
      });
      sourceContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        sourceContainer.classList.remove("drop-indicator");
        if (!draggedData) return;
        // 根据鼠标在来源区域内的位置，计算应插入的位置（磁吸到相邻按钮间）
        const rect = sourceContainer.getBoundingClientRect();
        let insertIndex = sourceContainer.children.length;
        for (let i = 0; i < sourceContainer.children.length; i++) {
          const childRect = sourceContainer.children[i].getBoundingClientRect();
          if (e.clientX < childRect.left + childRect.width / 2) {
            insertIndex = i;
            break;
          }
        }
        if (draggedData.origin === "target") {
          // 来自目标区域时，已经在拖拽开始时清除了目标槽位
        } else if (draggedData.origin === "source") {
          // 如果在来源区域内拖动，则先删除原位置
          sourceItems.splice(draggedData.index, 1);
        }
        sourceItems.splice(insertIndex, 0, draggedData.item);
        renderSource();
        renderTarget();
      });

      /* 提交按钮处理：提交时将目标区域已填充的顺序和来源区域的顺序合并传出 */
      const handleSubmit = (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = "Submitted";
        // 构造最终排序结果：目标区域中已填项按槽位顺序，其余在来源区域的顺序随后排列
        const sortedOptions = targetSlots.filter(item => item !== null).concat(sourceItems);
        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            sortedOptions,
            confirmation: "Order submitted successfully"
          }
        });
      };

      formElement.addEventListener("submit", handleSubmit);

      // 返回清理函数
      return () => {
        formElement.removeEventListener("submit", handleSubmit);
        container.remove();
      };

    } catch (error) {
      console.error("SortableList Component Error:", error.message);
    }
  }
};
