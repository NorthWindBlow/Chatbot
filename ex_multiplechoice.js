export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      const { title, options, submitEvent } = trace.payload;

      // Ensure required fields are present
      if (!title || !Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: title, options (non-empty array), or submitEvent");
      }

      const container = document.createElement('div');
      container.className = 'multiple-choice-container'; // Generic class name

      // HTML structure for the multiple choice form
      container.innerHTML = `<form id="multiple-choice-form" class="mc-form"></form>`;

      // Style definitions for the component
      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          max-width: 680px;
          margin: 1rem auto;
          padding: 1.5rem;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
          font-size: 14px; /* 系统默认字号 */
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          margin-bottom: 1.5rem;
        }

        .option {
          position: relative;
          padding: 12px;
          background: #f5f5f7;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e0e0e0;
        }

        .option:hover {
          background: #ebebfb;
          transform: none; /* 移除上浮效果 */
        }

        .option input {
          opacity: 0;
          position: absolute;
        }

        .option input:checked + .checkmark {
          opacity: 1;
          transform: scale(1);
        }

        .option input:checked ~ .option-text {
          color: #007AFF;
          font-weight: 500;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border-radius: 5px;
          right: 10px;
          top: 10px;
        }

        .checkmark::after {
          content: '';
          position: absolute;
          left: 7px;
          top: 3px;
          width: 7px;
          height: 12px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .option-text {
          color: #1d1d1f;
          transition: color 0.2s ease;
          padding-right: 2rem;
          line-height: 1.4;
          font-size: 0.95em; /* 接近系统默认 */
        }

        .mc-form button[type="submit"] {
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          padding: 1rem 2.4rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          float: right;
          box-shadow: 0 4px 12px rgba(0,122,255,0.25);
        }

        .mc-form button[type="submit"] {
          padding: 8px 20px;
          font-size: 0.95em;
          border-radius: 8px;
        }

        .mc-form button[type="submit"]:active {
          transform: translateY(0);
          opacity: 0.9;
        }

        /* 其他选项样式 */
        .other-input {
          margin-top: 1.5rem;
        }

        .other-input input {
          width: 100%;
          padding: 1rem;
          border: 1px solid #d2d2d7;
          border-radius: 12px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .other-input input:focus {
          outline: none;
          border-color: #007AFF;
          box-shadow: 0 0 0 3px rgba(0,122,255,0.15);
        }

        /* 禁用状态 */
        .multiple-choice-container.disabled .option {
          opacity: 0.6;
          pointer-events: none;
        }
      `;
      container.appendChild(style); // Append style to container

      element.appendChild(container);

      const form = container.querySelector('#multiple-choice-form');
      const grid = document.createElement('div');
      grid.className = 'options-grid';
      form.appendChild(grid);

      // Create the checkbox options dynamically
      options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = `
          <input type="checkbox" name="option" value="${option}">
          <div class="checkmark"></div>
          <span class="option-text">${option}</span>
        `;
        grid.appendChild(label);
      });

      // Create other input field (if "Other" option exists)
      const hasOtherOption = options.includes("Other");
      let otherInputContainer;
      if (hasOtherOption) {
        otherInputContainer = document.createElement('div');
        otherInputContainer.className = 'other-input';
        otherInputContainer.innerHTML = `
          <input type="text" id="other-option" placeholder="Specify other option">
        `;
        form.appendChild(otherInputContainer);

        // Add event listener for 'Other' checkbox
        const otherCheckbox = form.querySelector('input[value="Other"]');
        otherCheckbox.addEventListener('change', () => {
          if (otherCheckbox.checked) {
            otherInputContainer.style.display = 'block';
          } else {
            otherInputContainer.style.display = 'none';
          }
        });
      }

      // Create submit button
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
          if (otherValue) {
            selectedOptions.push(otherValue);
          }
        }

        if (selectedOptions.length === 0) {
          alert('Please select at least one option.');
          return;
        }

        // Disable all checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(input => {
          input.disabled = true;
        });

        // Disable "Other" input field (if exists)
        if (hasOtherOption) {
          const otherInput = form.querySelector('#other-option');
          otherInput.disabled = true;
        }

        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Submitted';
        submitButton.style.backgroundColor = '#808080';
        submitButton.style.cursor = 'not-allowed';

        // Trigger the submit event
        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            selectedOptions: selectedOptions,
            confirmation: 'Options submitted successfully'
          }
        });
      };

      form.addEventListener('submit', submitHandler);

      // Cleanup function
      return () => {
        form.removeEventListener('submit', submitHandler);
        container.remove();
      };

    } catch (error) {
      console.error("MultipleChoice Component Error:", error.message);
    }
  }
};
