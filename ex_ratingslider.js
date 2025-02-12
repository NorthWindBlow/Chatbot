export const RatingSlider = {
  name: 'RatingSlider',
  type: 'response',
  match: ({ trace }) => 
    trace.type === 'rating_slider' || trace.payload.name === 'rating_slider',

  render: ({ trace, element }) => {
    try {
      const { options, labels = [1, 100], submitEvent } = trace.payload;
      
      // 输入验证
      if (!Array.isArray(options) || options.length === 0 || !submitEvent) {
        throw new Error("Missing required parameters");
      }
      if (!Array.isArray(labels) || labels.length < 2) {
        throw new Error("Labels must be an array with at least 2 elements");
      }

      // 生成刻度位置
      const labelPositions = labels.map((_, i) => 
        Math.round((i / (labels.length - 1)) * 100
      );

      const container = document.createElement('div');
      container.className = 'rating-slider-container';

      // 样式定义
      const style = document.createElement('style');
      style.textContent = `
        .rating-slider-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 1rem;
          font-family: -apple-system, sans-serif;
        }

        .option-row {
          display: flex;
          align-items: center;
          margin: 2rem 0;
          position: relative;
        }

        .option-label {
          flex: 0 0 120px;
          margin-right: 1rem;
          font-weight: 500;
          color: #333;
        }

        .slider-container {
          flex: 1;
          position: relative;
          height: 60px;
        }

        .scale-labels {
          display: flex;
          justify-content: space-between;
          position: absolute;
          width: 100%;
          top: 30px;
          pointer-events: none;
        }

        .scale-label {
          position: absolute;
          transform: translateX(-50%);
          font-size: 0.85em;
          color: #666;
          white-space: nowrap;
        }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          background: #ddd;
          border-radius: 2px;
          margin: 15px 0;
          outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          background: #007AFF;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .value-display {
          margin-left: 1rem;
          min-width: 60px;
          text-align: center;
          font-weight: 600;
          color: #007AFF;
          font-size: 1.1em;
        }

        .zoom-overlay {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 85vw;
          max-width: 400px;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
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

        .zoom-slider-track {
          height: 6px;
          background: #eee;
          margin: 30px 0;
          position: relative;
          border-radius: 3px;
        }

        .zoom-thumb {
          width: 32px;
          height: 32px;
          background: #007AFF;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          cursor: grab;
          transition: transform 0.2s;
        }

        .zoom-thumb:active {
          transform: translate(-50%, -50%) scale(1.1);
          cursor: grabbing;
        }

        .zoom-scale-mark {
          position: absolute;
          top: -20px;
          transform: translateX(-50%);
          font-size: 0.9em;
          color: #888;
        }

        .submit-btn {
          display: block;
          margin: 2rem auto;
          padding: 12px 36px;
          background: linear-gradient(135deg, #007AFF, #0063CC);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,122,255,0.3);
        }
      `;
      container.appendChild(style);

      // 工具函数：找到最近刻度
      const findNearestPosition = (value) => {
        return labelPositions.reduce((prev, curr) => 
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      };

      // 工具函数：获取标签索引
      const getLabelIndex = (value) => {
        return labelPositions.findIndex(pos => pos === value);
      };

      // 创建放大控件
      const createZoomSlider = (option, initialValue) => {
        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';
        
        const track = document.createElement('div');
        track.className = 'zoom-slider-track';
        
        // 创建刻度标记
        labels.forEach((label, i) => {
          const mark = document.createElement('div');
          mark.className = 'zoom-scale-mark';
          mark.style.left = `${labelPositions[i]}%`;
          mark.textContent = label;
          track.appendChild(mark);
        });

        // 创建滑块
        const thumb = document.createElement('div');
        thumb.className = 'zoom-thumb';
        const initialPos = findNearestPosition(initialValue);
        thumb.style.left = `${initialPos}%`;

        // 数值显示
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = labels[getLabelIndex(initialPos)] || initialPos;
        valueDisplay.style.textAlign = 'center';
        valueDisplay.style.margin = '1rem 0';
        valueDisplay.style.fontSize = '1.2em';

        // 交互逻辑
        let isDragging = false;
        
        const updatePosition = (clientX) => {
          const rect = track.getBoundingClientRect();
          let percent = (clientX - rect.left) / rect.width * 100;
          percent = Math.max(0, Math.min(100, percent));
          const snapPercent = findNearestPosition(percent);
          
          thumb.style.left = `${snapPercent}%`;
          valueDisplay.textContent = labels[getLabelIndex(snapPercent)] || snapPercent;
          return snapPercent;
        };

        // 事件监听
        thumb.addEventListener('mousedown', () => isDragging = true);
        track.addEventListener('click', (e) => {
          const percent = updatePosition(e.clientX);
          document.dispatchEvent(new CustomEvent('zoomSliderUpdate', { detail: percent }));
        });

        document.addEventListener('mousemove', (e) => {
          if (isDragging) updatePosition(e.clientX);
        });
        document.addEventListener('mouseup', () => isDragging = false);

        // 组装组件
        overlay.innerHTML = `
          <h3 style="margin: 0 0 1rem; color: #333">调整 ${option}</h3>
          ${valueDisplay.outerHTML}
        `;
        track.appendChild(thumb);
        overlay.appendChild(track);

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'submit-btn';
        closeBtn.textContent = '完成';
        closeBtn.style.marginTop = '1.5rem';
        closeBtn.onclick = () => {
          document.body.removeChild(overlay);
          document.body.removeChild(backdrop);
        };

        overlay.appendChild(closeBtn);
        return overlay;
      };

      // 创建主滑块行
      options.forEach(option => {
        const row = document.createElement('div');
        row.className = 'option-row';

        const label = document.createElement('div');
        label.className = 'option-label';
        label.textContent = option;

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        // 主滑块
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;
        slider.value = 50;

        // 刻度标签
        const scaleLabels = document.createElement('div');
        scaleLabels.className = 'scale-labels';
        labels.forEach((text, i) => {
          const span = document.createElement('span');
          span.className = 'scale-label';
          span.textContent = text;
          span.style.left = `${labelPositions[i]}%`;
          scaleLabels.appendChild(span);
        });

        // 数值显示
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'value-display';
        
        // 更新显示
        const updateDisplay = (value) => {
          const snapValue = findNearestPosition(value);
          const labelIndex = getLabelIndex(snapValue);
          valueDisplay.textContent = labels[labelIndex] || snapValue;
          slider.value = snapValue;
        };

        // 事件监听
        slider.addEventListener('input', (e) => updateDisplay(e.target.value));

        // 长按处理
        let pressTimer;
        const startPress = () => {
          pressTimer = setTimeout(() => {
            const backdrop = document.createElement('div');
            backdrop.className = 'zoom-backdrop';
            
            const zoomSlider = createZoomSlider(option, slider.value);
            document.body.appendChild(backdrop);
            document.body.appendChild(zoomSlider);

            // 同步更新主滑块
            document.addEventListener('zoomSliderUpdate', (e) => {
              updateDisplay(e.detail);
            });
          }, 600);
        };

        const cancelPress = () => clearTimeout(pressTimer);
        
        slider.addEventListener('touchstart', startPress);
        slider.addEventListener('touchend', cancelPress);
        slider.addEventListener('touchcancel', cancelPress);
        slider.addEventListener('mousedown', startPress);
        slider.addEventListener('mouseup', cancelPress);
        slider.addEventListener('mouseleave', cancelPress);

        // 初始化显示
        updateDisplay(slider.value);

        // 组装组件
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(scaleLabels);
        sliderContainer.appendChild(valueDisplay);
        row.appendChild(label);
        row.appendChild(sliderContainer);
        container.appendChild(row);
      });

      // 提交按钮
      const submitButton = document.createElement('button');
      submitButton.className = 'submit-btn';
      submitButton.textContent = '提交评分';
      
      submitButton.onclick = (e) => {
        e.preventDefault();
        const results = Array.from(container.querySelectorAll('.option-row')).map(row => {
          const value = parseInt(row.querySelector('input').value);
          return {
            option: row.querySelector('.option-label').textContent,
            score: value,
            display: labels[getLabelIndex(value)] || value
          };
        });

        window.voiceflow.chat.interact({
          type: submitEvent,
          payload: {
            ratings: results,
            confirmation: '评分提交成功'
          }
        });

        submitButton.disabled = true;
        submitButton.textContent = '已提交';
      };

      container.appendChild(submitButton);
      element.appendChild(container);

      return () => container.remove();

    } catch (error) {
      console.error("RatingSlider Error:", error.message);
      const errorDiv = document.createElement('div');
      errorDiv.style.color = 'red';
      errorDiv.textContent = `评分组件加载失败: ${error.message}`;
      element.appendChild(errorDiv);
    }
  }
};
