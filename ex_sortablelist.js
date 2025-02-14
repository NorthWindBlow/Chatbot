export const SortableList = {
  name: 'SortableList',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'sortable_list' || trace.payload.name === 'sortable_list',

  render: ({ trace, element }) => {
    try {
      let { options, submitEvent } = trace.payload;
      
      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: options (non-empty array) or submitEvent");
      }

      // 如果 options 是数组，则过滤掉其中的 "None" 元素
      options = Array.isArray(options)
        ? options.filter(item => item !== "None")
        : options;

      const container = document.createElement('div');
      container.className = 'sortable-container';

      const style = document.createElement('style');
      style.textContent = `
        .sortable-container {
          max-width: 680px;
          margin: 1rem auto;
        }

        .sortable-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 1.5rem;
        }

        .sortable-item {
          padding: 1rem;
          background: #f0f5ff;
          border: 2px solid #007AFF;
          border-radius: 8px;
          cursor: move;
          transition: all 0.2s ease;
          user-select: none;
          touch-action: none;
        }

        .sortable-item.dragging {
          background: #007AFF !important;
          color: white;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: scale(1.02);
        }

        .sortable-item.over {
          border: 2px dashed #007AFF;
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

      const form = document.createElement('form');
      const grid = document.createElement('div');
      grid.className = 'sortable-grid';
      form.appendChild(grid);

      // 创建可排序项
      let dragItem = null;
      let currentOrder = [...options];

      const createItem = (text) => {
        const item = document.createElement('div');
        item.className = 'sortable-item';
        item.draggable = true;
        item.textContent = text;

        // 拖拽事件处理
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragend', handleDragEnd);

        return item;
      };

      // 初始化网格
      options.forEach(option => {
        grid.appendChild(createItem(option));
      });

      // 拖拽处理函数
      function handleDragStart(e) {
        dragItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
      }

      function handleDragOver(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(grid, e.clientY);
        const currentPos = [...grid.children].indexOf(dragItem);
        let newPos = [...grid.children].indexOf(afterElement);

        if (afterElement == null) {
          grid.appendChild(dragItem);
        } else {
          grid.insertBefore(dragItem, afterElement);
        }

        // 更新顺序数组
        currentOrder.splice(currentPos, 1);
        currentOrder.splice(newPos, 0, dragItem.textContent);
      }

      function handleDragEnd() {
        this.classList.remove('dragging');
        dragItem = null;
      }

      // 计算插入位置
      function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
        
        return elements.reduce((closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
      }

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'submit-btn';
      submitButton.textContent = 'Submit Order';
      form.appendChild(submitButton);

      // 提交处理
      const submitHandler = (e) => {
        e.preventDefault();

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            sortedOptions: currentOrder,
            confirmation: 'Order submitted successfully'
          }
        });
      };

      form.addEventListener('submit', submitHandler);
      container.appendChild(form);
      element.appendChild(container);

      return () => {
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };

    } catch (error) {
      console.error("SortableList Component Error:", error.message);
    }
  }
};
