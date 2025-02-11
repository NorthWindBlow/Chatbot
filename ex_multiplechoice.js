export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      const { title, options, submitEvent } = trace.payload;

      if (!title || !Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: title, options (non-empty array), or submitEvent");
      }

      const container = document.createElement('div');
      container.className = 'multiple-choice-container';

      // 简化容器样式
      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          max-width: 680px; /* 限制容器的最大宽度为 680px，确保内容不会过宽。*/
          margin: 1rem auto; /* 设置容器上下边距为 1rem，左右边距为 auto，使容器水平居中。 */
        }

        .options-grid {
          display: grid; /* 使用 CSS Grid 布局来排列选项。 */
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自动调整列数，以适应容器宽度。每列的最小宽度为 200px，最大宽度为剩余空间的等分（1fr）。 */
          gap: 10px; /* 设置选项之间的间距为 12px。 */
          margin-bottom: 1rem; /* 在网格底部添加 1rem 的外边距。 */
        }

        .option {
          position: relative;
          padding: 1.4rem;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
        }

        .option:hover {
          background: #f0f0f0 !important;
        }

        .option.selected {
          background: #007AFF !important;
          border-color: #007AFF;
          color: white;
        }

        .option input {
          opacity: 0;
          position: absolute;
        }

        .option-text {
          display: block;
          line-height: 1.4;
        }

        .mc-form button[type="submit"] {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          padding: 0.5rem 1.5rem; /* 减小上下 padding */
          border-radius: 8px;
          font-size: 1rem; /* 减小字体大小 */
          cursor: pointer;
          transition: all 0.2s ease;
          float: centre;
          display: block; /* 让按钮居中 */
          margin: 0 auto; /* 让按钮居中 */
          width: fit-content; /* 让按钮宽度自适应内容 */
        }

        .mc-form button[type="submit"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .other-input input {
          width: 100%;
          padding: 0.8rem; /* 调整输入框内边距 */
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          margin-top: 1rem;
        }
      `;

      container.appendChild(style);
      element.appendChild(container);

      const form = document.createElement('form');
      form.className = 'mc-form';
      container.appendChild(form);

      const grid = document.createElement('div');
      grid.className = 'options-grid';
      form.appendChild(grid);

      // 创建选项
      options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = `
          <input type="checkbox" name="option" value="${option}">
          <span class="option-text">${option}</span>
        `;

        const input = label.querySelector('input');
        input.addEventListener('change', () => {
          label.classList.toggle('selected', input.checked);
        });

        grid.appendChild(label);
      });

      // 其他选项处理
      const hasOtherOption = options.includes("Other");
      let otherInputContainer;
      if (hasOtherOption) {
        otherInputContainer = document.createElement('div');
        otherInputContainer.className = 'other-input';
        otherInputContainer.innerHTML = `
          <input type="text" id="other-option" placeholder="Please type your answear">
        `;
        form.appendChild(otherInputContainer);

        const otherCheckbox = form.querySelector('input[value="Other"]');
        otherCheckbox.addEventListener('change', () => {
          otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
        });
      }

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      const submitHandler = (event) => {
        event.preventDefault();

        const selectedOptions = Array.from(form.querySelectorAll('input[name="option"]:checked'))
          .map(cb => cb.value);
        
        if (hasOtherOption && selectedOptions.includes("Other")) {
          const otherValue = form.querySelector('#other-option').value.trim();
          if (otherValue) selectedOptions.push(otherValue);
        }

        if (selectedOptions.length === 0) {
          alert('Please select at least one option.');
          return;
        }

        // 禁用组件
        form.querySelectorAll('input, button').forEach(el => el.disabled = true);
        submitButton.textContent = 'Submitted';
        submitButton.style.backgroundColor = '#808080';

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            selectedOptions: selectedOptions,
            confirmation: 'Options submitted successfully'
          }
        });
      };

      form.addEventListener('submit', submitHandler);

      return () => {
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };

    } catch (error) {
      console.error("MultipleChoice Component Error:", error.message);
    }
  }
};
