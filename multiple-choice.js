export const MultipleChoice = {
  name: 'MultipleChoice',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'Multiple_Choice' || trace.payload.name === 'Multiple_Choice',
  
  render: ({ trace, element }) => {
    try {
      const { VFapiKey } = trace.payload;

      // Ensure VFapiKey is present
      if (!VFapiKey) {
        throw new Error("Missing required input variables: VFapiKey");
      }

      const container = document.createElement('div');
      container.className = 'distress-selection'; // Added class directly to container

      // HTML structure for distress selection form
      container.innerHTML = `
        <h3>Select Pavement Distresses:</h3>
        <form id="distress-form"></form>
      `;

      // Style definitions for the component
      const style = document.createElement('style');
      style.textContent = `
        .distress-selection {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .distress-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Responsive grid */
          gap: 10px;
          margin-bottom: 20px;
        }
        .distress-option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
        .distress-option input {
          margin-right: 10px;
        }
        .other-input {
          display: none;
          margin-top: 10px;
        }
        .distress-selection button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
        .distress-selection button:hover {
          background: #0056b3;
        }
      `;
      container.appendChild(style); // Append style to container

      element.appendChild(container);

      const form = container.querySelector('#distress-form');
      const distresses = [
        "Inspection/ Assessment", "Maintenance Planning", "Maintenance Work", "Quality Management",
        "Research & Development", "Consultation", "Other"
      ];

      const grid = document.createElement('div'); // Created grid container
      grid.className = 'distress-grid';
      form.appendChild(grid);

      // Create the checkbox options dynamically
      distresses.forEach(distress => {
        const label = document.createElement('label');
        label.className = 'distress-option';
        label.innerHTML = `
          <input type="checkbox" name="distress" value="${distress}">
          <span>${distress}</span>
        `;
        grid.appendChild(label);
      });

      // Create other input field
      const otherInputContainer = document.createElement('div');
      otherInputContainer.className = 'other-input';
      otherInputContainer.innerHTML = `
        <input type="text" id="other-distress" placeholder="Specify other distress">
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

      // Create submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = 'Submit';
      form.appendChild(submitButton);

      const submitHandler = (event) => {
        event.preventDefault();

        const workDescription = Array.from(form.querySelectorAll('input[name="distress"]:checked'))
          .map(cb => cb.value);
        
        if (workDescription.includes("Other")) {
          const otherValue = form.querySelector('#other-distress').value.trim();
          if (otherValue) {
            workDescription.push(otherValue);
          }
        }

        if (workDescription.length === 0) {
          alert('Please select at least one distress.');
          return;
        }
        
        
        
        // Disable all checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(input => {
          input.disabled = true;
        });

        // Disable "Other" input field
        const otherInput = form.querySelector('#other-distress');
        if (otherInput) {
          otherInput.disabled = true;
        }

        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Submitted';
        submitButton.style.backgroundColor = '#808080';
        submitButton.style.cursor = 'not-allowed';
        
        
        
        window.voiceflow.chat.interact({
          type: 'complete_workScope',
          payload: {
            workDescription: workDescription,
            confirmation: 'Work description submitted successfully'
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
      console.error("Extension Error:", error.message);
    }
  }
};
