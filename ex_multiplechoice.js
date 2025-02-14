export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      const { options, selectionLimit = 999, submitEvent } = trace.payload;

      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: options (non-empty array) or submitEvent");
      }

      const container = document.createElement('div');
      container.className = 'multiple-choice-container';

      // 样式定义
      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          width: auto;
          max-width: 100%;
          margin: 0.5rem 0.5rem;
          padding: 10px 10px 10px; /* 上10 左右10 下10 */
          background: #FCE18D;
        }
        .options-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 24px;
          width: auto;
          max-width: 85%;
          justify-content: flex-start; /* 左对齐防止间隙不均 */
          background: #2196f3;
        }
        .option {
          position: relative;
          padding: 0.6rem 1rem;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          white-space: nowrap;
          max-width: 100%;
          min-width: min-content;
          min-height: min-content;
          display: flex;
          align-items: center;
          justify-content: center;
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
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          white-space: nowrap;
        }
        @media (max-width: 768px) {
          .option {
            white-space: normal;
            word-break: break-word;
          }
          .options-flow {
            grid-template-columns: 1fr;
          }
        }
        .mc-form button[type="submit"] {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: block;
          margin: 0 auto;
          width: fit-content;
        }
        .mc-form button[type="submit"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .other-input {
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }
        .other-input input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          margin-top: 0.2rem;
        }
      `;
      container.appendChild(style);
      element.appendChild(container);

      const form = document.createElement('form');
      form.className = 'mc-form';
      container.appendChild(form);

      const flowContainer = document.createElement('div');
      flowContainer.className = 'options-flow';
      form.appendChild(flowContainer);

      // 创建选项
      options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = `
          <input type="checkbox" name="option" value="${option}">
          <span class="option-text">${option}</span>
        `;
        const input = label.querySelector('input');
        // 监听选中状态变化，更新样式并检查选择数量限制
        input.addEventListener('change', () => {
          label.classList.toggle('selected', input.checked);
          updateCheckboxState();
        });
        flowContainer.appendChild(label);
      });

      // 自动调整布局
      const adjustLayout = () => {
        const containerWidth = container.offsetWidth;
        const parentWidth = container.parentElement.offsetWidth;
        flowContainer.style.gridTemplateColumns = containerWidth >= parentWidth 
          ? 'repeat(auto-fill, minmax(min-content, 1fr))'
          : 'repeat(auto-fit, minmax(120px, max-content))';
      };
      adjustLayout();
      window.addEventListener('resize', adjustLayout);

      // “Other”选项处理
      const hasOtherOption = options.includes("Other");
      let otherInputContainer;
      if (hasOtherOption) {
        otherInputContainer = document.createElement('div');
        otherInputContainer.className = 'other-input';
        otherInputContainer.innerHTML = `
          <input type="text" id="other-option" placeholder="Please type your answer">
        `;
        form.appendChild(otherInputContainer);
        const otherCheckbox = form.querySelector('input[value="Other"]');
        otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
        otherCheckbox.addEventListener('change', () => {
          otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none';
          updateCheckboxState();
        });
      }

      // 根据已选数量更新其他选项的禁用状态
      const updateCheckboxState = () => {
        const checkboxes = Array.from(form.querySelectorAll('input[name="option"]'));
        const checkedCount = checkboxes.filter(cb => cb.checked).length;
        // 当达到上限时，禁用未选中的复选框，否则恢复可用状态
        checkboxes.forEach(cb => {
          if (!cb.checked) {
            cb.disabled = checkedCount >= selectionLimit;
          }
        });
      };

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      // 提交处理函数
      const submitHandler = (event) => {
        event.preventDefault();

        // 获取所有选中的选项（包括 “Other” 选项）
        let selectedOptions = Array.from(form.querySelectorAll('input[name="option"]:checked'))
          .map(cb => cb.value);

        if (hasOtherOption && selectedOptions.includes("Other")) {
          const otherValue = form.querySelector('#other-option').value.trim();
          if (otherValue) selectedOptions.push(otherValue);
        }

        if (selectedOptions.length === 0) {
          alert('Please select at least one option.');
          return;
        }

        // 禁用所有输入控件，防止重复提交
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

      // 清理工作
      return () => {
        window.removeEventListener('resize', adjustLayout);
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };

    } catch (error) {
      console.error("MultipleChoice Component Error:", error.message);
    }
  }
};
