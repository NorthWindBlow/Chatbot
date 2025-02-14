export const SortableList = {
  name: 'SortableList',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'sortable_list' || trace.payload.name === 'sortable_list',

  render: ({ trace, element }) => {
    try {
      let { options, submitEvent } = trace.payload;
      
      // 参数验证
      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input: options (non-empty array) and submitEvent");
      }

      // 过滤无效选项
      const filteredOptions = options.filter(item => item !== "None");
      if (filteredOptions.length === 0) {
        throw new Error("No valid options after filtering");
      }

      const container = document.createElement('div');
      container.className = 'sortable-container';

      // 样式改进
      const style = document.createElement('style');
      style.textContent = `
        .sortable-container {
          width: 100%;
          max-width: 800px;
          margin: 1rem auto;
          padding: 0 15px;
        }

        .sortable-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
          position: relative;
          min-height: 60px;
        }

        .sortable-item {
          padding: 12px 20px;
          background: rgba(0, 122, 255, 0.1);
          border: 2px solid #007AFF;
          border-radius: 8px;
          cursor: move;
          transition: all 0.2s ease;
          user-select: none;
          touch-action: none;
          position: relative;
          z-index: 1;
        }

        .sortable-item.dragging {
          background: #007AFF;
          color: white;
          z-index: 2;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          opacity: 0.8;
        }

        .phantom-placeholder {
          border: 2px dashed #007AFF;
          background: rgba(0, 122, 255, 0.05);
          border-radius: 8px;
          position: relative;
          z-index: 0;
        }

        .submit-btn {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: block;
          margin: 20px auto 0;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
      container.appendChild(style);

      const form = document.createElement('form');
      const listContainer = document.createElement('div');
      listContainer.className = 'sortable-list';
      form.appendChild(listContainer);

      // 状态管理
      let draggedItem = null;
      let phantomPlaceholder = null;
      let currentOrder = [...filteredOptions];

      // 创建可拖拽项
      const createSortableItem = (text) => {
        const item = document.createElement('div');
        item.className = 'sortable-item';
        item.draggable = true;
        item.textContent = text;

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragleave', handleDragLeave);

        return item;
      };

      // 初始化列表
      filteredOptions.forEach(option => {
        listContainer.appendChild(createSortableItem(option));
      });

      // 拖拽处理函数
      const handleDragStart = function(e) {
        draggedItem = this;
        setTimeout(() => this.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      };

      const handleDragOver = function(e) {
        e.preventDefault();
        if (!draggedItem) return;

        // 计算插入位置
        const items = Array.from(listContainer.children)
          .filter(item => !item.classList.contains('phantom-placeholder'));
        const dragIndex = items.indexOf(draggedItem);
        const targetIndex = items.indexOf(this);
        
        // 避免自我覆盖
        if (dragIndex === targetIndex) return;

        const { y: targetY, height: targetHeight } = this.getBoundingClientRect();
        const isAfter = e.clientY > targetY + targetHeight / 2;

        // 创建/更新占位符位置
        if (!phantomPlaceholder) {
          phantomPlaceholder = document.createElement('div');
          phantomPlaceholder.className = 'phantom-placeholder';
          listContainer.insertBefore(phantomPlaceholder, this);
        }
        
        listContainer.insertBefore(
          phantomPlaceholder, 
          isAfter ? this.nextSibling : this
        );
      };

      const handleDragEnd = function() {
        // 移动实际元素
        if (phantomPlaceholder) {
          listContainer.insertBefore(draggedItem, phantomPlaceholder);
          phantomPlaceholder.remove();
          phantomPlaceholder = null;
        }
        
        // 更新当前顺序
        currentOrder = Array.from(listContainer.children)
          .filter(item => item.classList.contains('sortable-item'))
          .map(item => item.textContent);
        
        draggedItem.classList.remove('dragging');
        draggedItem = null;
      };

      const handleDragLeave = function(e) {
        if (!listContainer.contains(e.relatedTarget)) {
          phantomPlaceholder?.remove();
          phantomPlaceholder = null;
        }
      };

      // 提交处理
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.className = 'submit-btn';
      submitButton.textContent = 'Submit Order';
      form.appendChild(submitButton);

      const handleSubmit = (e) => {
        e.preventDefault();
        
        // 禁用按钮防止重复提交
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

      form.addEventListener('submit', handleSubmit);
      container.appendChild(form);
      element.appendChild(container);

      // 清理函数
      return () => {
        form.removeEventListener('submit', handleSubmit);
        container.remove();
      };

    } catch (error) {
      console.error("SortableList Error:", error);
      const errorEl = document.createElement('div');
      errorEl.textContent = `Error: ${error.message}`;
      element.appendChild(errorEl);
    }
  }
};
