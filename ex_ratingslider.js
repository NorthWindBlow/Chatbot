export const RatingSlider = {
  name: 'RatingSlider',
  type: 'response',
  match: ({ trace }) => 
    trace.type === 'rating_slider' || trace.payload.name === 'rating_slider',

  render: ({ trace, element }) => {
    try {
      const { options, labels = [1, 100], submitEvent } = trace.payload;

      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required input variables: options (non-empty array) or submitEvent");
      }

      const container = document.createElement('div');
      container.className = 'rating-slider-container';

      // 样式定义
      const style = document.createElement('style');
      style.textContent = `
        .rating-slider-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 1rem;
        }

        .option-row {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          position: relative;
        }

        .option-label {
          flex: 0 0 120px;
          margin-right: 1rem;
          font-weight: 500;
        }

        .slider-container {
          flex: 1;
          position: relative;
          height: 50px;
        }

        .slider-scale {
          position: relative;
          height: 30px;
          margin: 0 10px;
        }

        .scale-labels {
          display: flex;
          justify-content: space-between;
          position: absolute;
          width: 100%;
          bottom: -20px;
          font-size: 0.8em;
          color: #666;
        }

        .scale-label {
          position: absolute;
          transform: translateX(-50%);
        }

        input[type="range"] {
          width: 100%;
          -webkit-appearance: none;
          height: 4px;
          background: #ddd;
          border-radius: 2px;
          margin: 15px 0;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          background: #007AFF;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .value-display {
          margin-left: 1rem;
          min-width: 40px;
          text-align: center;
          font-weight: bold;
          color: #007AFF;
        }

        .zoom-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80vw;
          max-width: 400px;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          z-index: 1000;
        }

        .zoom-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
      `;
      container.appendChild(style);

      // 创建悬浮放大控件
      const createZoomSlider = (option, initialValue) => {
        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 1;
        slider.max = 100;
        slider.value = initialValue;
        slider.style.width = '100%';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '1rem';

        overlay.innerHTML = `
          <h3>Adjust ${option}</h3>
          <div style="margin: 1rem 0">
            ${slider.outerHTML}
            <div class="value-display">${initialValue}</div>
          </div>
        `;
        overlay.appendChild(closeButton);

        // 更新显示值
        slider.addEventListener('input', () => {
          overlay.querySelector('.value-display').textContent = slider.value;
        });

        // 关闭弹窗
        const close = () => {
          document.body.removeChild(overlay);
          document.body.removeChild(backdrop);
        };
        
        const backdrop = document.createElement('div');
        backdrop.className = 'zoom-backdrop';
        backdrop.addEventListener('click', close);
        closeButton.addEventListener('click', close);

        document.body.appendChild(backdrop);
        document.body.appendChild(overlay);

        return slider;
      };

      // 创建刻度标签
      const createScaleLabels = (labels) => {
        const container = document.createElement('div');
        container.className = 'scale-labels';
        
        labels.forEach((label, index) => {
          const span = document.createElement('span');
          span.className = 'scale-label';
          span.textContent = label;
          span.style.left = `${(index / (labels.length - 1)) * 100}%`;
          container.appendChild(span);
        });

        return container;
      };

      // 创建选项行
      options.forEach(option => {
        const row = document.createElement('div');
        row.className = 'option-row';

        const label = document.createElement('div');
        label.className = 'option-label';
        label.textContent = option;

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 1;
        slider.max = 100;
        slider.value = 50;

        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = slider.value;

        // 更新显示值
        slider.addEventListener('input', () => {
          valueDisplay.textContent = slider.value;
        });

        // 长按处理
        let pressTimer;
        slider.addEventListener('touchstart', () => {
          pressTimer = setTimeout(() => {
            const zoomSlider = createZoomSlider(option, slider.value);
            zoomSlider.addEventListener('change', () => {
              slider.value = zoomSlider.value;
              valueDisplay.textContent = zoomSlider.value;
            });
          }, 500);
        });

        slider.addEventListener('touchend', () => clearTimeout(pressTimer));

        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(createScaleLabels(labels));
        sliderContainer.appendChild(valueDisplay);

        row.appendChild(label);
        row.appendChild(sliderContainer);
        container.appendChild(row);
      });

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.textContent = 'Submit Ratings';
      submitButton.style.cssText = `
        display: block;
        margin: 2rem auto;
        padding: 0.8rem 2rem;
        background: #007AFF;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      `;

      submitButton.onclick = (e) => {
        e.preventDefault();
        const results = Array.from(container.querySelectorAll('.option-row')).map(row => ({
          option: row.querySelector('.option-label').textContent,
          score: parseInt(row.querySelector('input[type="range"]').value)
        }));

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            ratings: results,
            confirmation: 'Ratings submitted successfully'
          }
        });

        submitButton.disabled = true;
        submitButton.style.backgroundColor = '#808080';
        submitButton.textContent = 'Submitted';
      };

      container.appendChild(submitButton);
      element.appendChild(container);

      return () => container.remove();

    } catch (error) {
      console.error("RatingSlider Component Error:", error.message);
    }
  }
};
