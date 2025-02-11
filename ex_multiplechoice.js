export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'multiple_choice' || trace.payload.name === 'multiple_choice',

  render: ({ trace, element }) => {
    try {
      const { apiKey, title, options, submitEvent } = trace.payload;

      // Ensure required fields are present
      if (!apiKey || !title || !options || !submitEvent) {
        throw new Error("Missing required input variables: apiKey, title, options, or submitEvent");
      }

      const container = document.createElement('div');
      container.className = 'multiple-choice-container'; // Generic class name

      // HTML structure for the multiple choice form
      container.innerHTML = `
        <h3>${title}</h3>
        <form id="multiple-choice-form"></form>
      `;

      // Style definitions for the component
      const style = document.createElement('style');
      style.textContent = `
        .multiple-choice-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: left;
        }
        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Responsive grid */
          gap: 10px;
          margin-bottom: 20px;
        }
        .option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        .option input {
          margin-right: 10px; /* Checkbox before text */
        }
        .other-input {
          display: none;
          margin-top: 10px;
        }
        .multiple-choice-container button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
        .multiple-choice-container button:hover {
          background: #0056b3;
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
          <span>${option}</span>
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
