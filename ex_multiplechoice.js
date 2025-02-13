export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      const { options, submitEvent } = trace.payload;

      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: options (non-empty array) or submitEvent");
      }

      const container = document.createElement('div');
      container.className = 'multiple-choice-container';

      // 简化容器样式
      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          display: inline-block;
          max-width: 100% !important;
          margin: 1rem 0;
          position: relative;
        }

        .options-grid {
          display: flex; /* 使用 CSS flex 布局来排列选项。 */
          flex-wrap: wrap;
          gap: 10px; /* 设置选项之间的间距为 10px。 */
          margin-bottom: 1rem; /* 在网格底部添加 1rem 的外边距。 */
          width: max-content;
          max-width: 100%;
        }

        .option {
          position: relative; /* 设置相对定位，以便内部元素（如 input）可以绝对定位。 */
          padding: 0.8rem; /* 设置选项的内边距为 0.8rem。 */
          border: 1px solid #d2d2d7; /* 设置边框为 1px 的浅灰色。 */
          border-radius: 8px; /* 设置圆角为 8px。 */
          cursor: pointer; /* 将鼠标指针设置为手形，表示可点击。 */
          transition: all 0.2s ease; /* 添加过渡效果，使样式变化更平滑。 */
          background: transparent; /* 设置背景为透明。 */
          flex: 0 1 auto;
          min-width: min-content;
          white-space: nowrap;
          max-width: 100%;
        }

        .option:hover {
          background: #f0f0f0 !important; /* 定义鼠标悬停时选项的样式。 */
        }

        .option.selected {
          background: #007AFF !important; /* 定义选中选项的样式。将背景色改为蓝色。 */
          border-color: #007AFF; /* 将边框颜色改为蓝色。 */
          color: white; /* 将文字颜色改为白色。 */
        }

        .option input {
          opacity: 0; /* 将输入框的透明度设置为 0，使其不可见。 */
          position: absolute; /* 将输入框绝对定位，脱离文档流。 */
        }

        .option-text {
          display: block; /* 将文本设置为块级元素，使其独占一行。 */
          line-height: 1.2; /* 设置行高为 1.2，使文本更易读。 */
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center; /* 文字居中显示 */
        }

        /* 自适应换行逻辑 */
        .option.force-wrap {
          white-space: normal;
          word-break: break-word;
        }

        @media (max-width: 480px) {
          .option {
            white-space: normal;
            word-break: break-word;
          }
        }

        .mc-form button[type="submit"] {
          background: linear-gradient(135deg, #007AFF, #0063CC); /* 设置渐变色背景。 */
          color: white; /* 设置文字颜色为白色。 */
          border: none; /* 移除边框。 */
          padding: 0.5rem 1.5rem; /* 设置内边距。 */
          border-radius: 8px; /* 设置圆角。 */
          font-size: 1rem; /* 设置字体大小。 */
          cursor: pointer; /* 将鼠标指针设置为手形。 */
          transition: all 0.2s ease; /* 添加过渡效果。 */
          display: block; /* 将按钮设置为块级元素。 */
          margin: 0 auto; /* 使按钮水平居中。 */
          width: fit-content; /* 让按钮宽度自适应内容。 */
        }

        .mc-form button[type="submit"]:hover {
          transform: translateY(-1px); /* 将按钮向上移动 1px，产生悬浮效果。 */
          box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* 添加阴影效果。 */
        }

        .other-input {
          margin-top: 0.5rem; /* "Other" 输入框与选项之间的距离 */
          margin-bottom: 1rem; /* "Other" 输入框与提交按钮之间的距离 */
        }

        .other-input input {
          width: 90%; /* 设置输入框宽度为 80%。 */
          padding: 0.5rem; /* 设置内边距。 */
          border: 1px solid #d2d2d7; /* 设置边框。 */
          border-radius: 8px; /* 设置圆角。 */
          margin-top: 0.2rem; /* 设置上边距为 0.2rem。 */
        }
      `;

      container.appendChild(style);
      element.appendChild(container);

      const form = document.createElement('form');
      form.className = 'mc-form';
      container.appendChild(form);

      const flexContainer = document.createElement('div');
      flexContainer.className = 'options-flex';
      form.appendChild(flexContainer);

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

        flexContainer.appendChild(label);
      });

      // 自适应宽度逻辑
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const containerWidth = entry.contentRect.width;
          const options = entry.target.querySelectorAll('.option');
          
          options.forEach(option => {
            const optionWidth = option.getBoundingClientRect().width;
            // 如果选项宽度超过容器宽度的80%，强制换行
            if (optionWidth > containerWidth * 0.8) {
              option.classList.add('force-wrap');
            } else {
              option.classList.remove('force-wrap');
            }
          });

          // 更新容器最大宽度
          const maxRowWidth = Array.from(flexContainer.children).reduce((max, child) => {
            const rect = child.getBoundingClientRect();
            return Math.max(max, rect.left + rect.width - flexContainer.getBoundingClientRect().left);
          }, 0);
          
          flexContainer.style.width = `${Math.min(maxRowWidth, entry.contentRect.width)}px`;
        }
      });

      resizeObserver.observe(container);

      // 其他选项处理
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
        otherInputContainer.style.display = otherCheckbox.checked ? 'block' : 'none'; // 初始化时设置显示状态
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

        // 获取原始选中项（包含 "Other"）
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
