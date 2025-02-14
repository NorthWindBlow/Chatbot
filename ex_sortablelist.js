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

      // 如果 options 是数组，则过滤掉其中的 "None" 元素
      options = options.filter(item => item !== "None");

      // 创建外层容器
      const sortableContainer = document.createElement("div");
      sortableContainer.className = "sortable-container";

      // 添加样式
      const style = document.createElement("style");
      style.textContent = `
        .sortable-container {
          width: auto;
          max-width: 100%;
          margin: 1rem auto;
        }
        .sortable-list {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 24px;
          width: auto;
          max-width: 100%;
          justify-content: flex-start;
          align-items: flex-start; /* 防止行内选项因占位元素而拉高 */
        }
        .sortable-item {
          position: relative;
          padding: 1rem;
          background: transparent;
          border: 2px solid #007AFF;
          border-radius: 8px;
          cursor: move;
          transition: all 0.2s ease;
          user-select: none;
          touch-action: none;
          white-space: nowrap;
          max-width: 100%;
          min-width: min-content;
          min-height: min-content;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sortable-item.dragging {
          opacity: 0.5;
        }
        .sortable-item.placeholder {
          border: 2px dashed #007AFF;
          background: #f0f8ff;
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
      sortableContainer.appendChild(style);

      // 创建表单和排序列表容器
      const formElement = document.createElement("form");
      const sortableList = document.createElement("div");
      sortableList.className = "sortable-list";
      formElement.appendChild(sortableList);

      // 用于记录当前拖拽项、占位项以及排序结果
      let dragItem = null;
      let placeholderItem = null;
      let currentOrder = [...options];

      // 根据文本创建排序项元素
      const createSortableItem = (text) => {
        const item = document.createElement("div");
        item.className = "sortable-item";
        item.draggable = true;
        item.textContent = text;

        // 拖拽事件
        item.addEventListener("dragstart", handleDragStart);
        item.addEventListener("dragend", handleDragEnd);
        return item;
      };

      // 初始化排序列表
      options.forEach(option => {
        sortableList.appendChild(createSortableItem(option));
      });

      // 拖拽开始：创建占位元素，并隐藏原拖拽项
      function handleDragStart(e) {
        dragItem = this;
        // 创建占位元素，并设置相同的宽高
        placeholderItem = document.createElement("div");
        placeholderItem.className = "sortable-item placeholder";
        placeholderItem.style.width = `${dragItem.offsetWidth}px`;
        placeholderItem.style.height = `${dragItem.offsetHeight}px`;

        // 将占位元素插入到当前项后面
        sortableList.insertBefore(placeholderItem, dragItem.nextSibling);

        // 标记拖拽项并隐藏
        dragItem.classList.add("dragging");
        setTimeout(() => {
          dragItem.style.display = "none";
        }, 0);
      }

      // 拖拽过程中：根据鼠标位置移动占位元素
      function handleDragOver(e) {
        e.preventDefault();
        if (!dragItem || !placeholderItem) return;
        // 获取离鼠标位置最近的非拖拽、非占位元素
        const afterElement = getNearestElement(sortableList, e.clientX, e.clientY);
        if (afterElement) {
          sortableList.insertBefore(placeholderItem, afterElement);
        } else {
          sortableList.appendChild(placeholderItem);
        }
      }

      // 拖拽结束：将拖拽项插回占位位置，并更新排序结果
      function handleDragEnd() {
        dragItem.style.display = "";
        dragItem.classList.remove("dragging");
        if (placeholderItem && placeholderItem.parentElement) {
          sortableList.insertBefore(dragItem, placeholderItem);
          placeholderItem.remove();
        }
        // 根据 DOM 顺序更新排序
        currentOrder = Array.from(sortableList.children).map(
          child => child.textContent
        );
        dragItem = null;
        placeholderItem = null;
      }

      // 工具函数：根据鼠标位置获取最近的排序项（不包含拖拽项与占位项）
      function getNearestElement(container, x, y) {
        const items = Array.from(
          container.querySelectorAll(".sortable-item:not(.dragging):not(.placeholder)")
        );
        let closest = { distance: Number.POSITIVE_INFINITY, element: null };
        items.forEach(item => {
          const rect = item.getBoundingClientRect();
          const itemCenterX = rect.left + rect.width / 2;
          const itemCenterY = rect.top + rect.height / 2;
          const dx = x - itemCenterX;
          const dy = y - itemCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < closest.distance) {
            closest = { distance, element: item };
          }
        });
        return closest.element;
      }

      // 给排序列表容器添加拖拽过程监听（确保整个区域都能响应拖拽移动）
      sortableList.addEventListener("dragover", handleDragOver);

      // 提交按钮及提交处理函数
      const submitButton = document.createElement("button");
      submitButton.type = "submit";
      submitButton.className = "submit-btn";
      submitButton.textContent = "Submit";
      formElement.appendChild(submitButton);

      const handleSubmit = (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = "Submitted";

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            sortedOptions: currentOrder,
            confirmation: "Order submitted successfully"
          }
        });
      };

      formElement.addEventListener("submit", handleSubmit);
      sortableContainer.appendChild(formElement);
      element.appendChild(sortableContainer);

      // 返回清理函数，移除事件监听和 DOM 节点
      return () => {
        formElement.removeEventListener("submit", handleSubmit);
        sortableList.removeEventListener("dragover", handleDragOver);
        sortableContainer.remove();
      };

    } catch (error) {
      console.error("SortableList Component Error:", error.message);
    }
  }
};
