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
      
      // 验证labels参数
      const validLabels = Array.isArray(labels) && labels.length >= 2;
      if (!validLabels) throw new Error("Invalid labels format");

      // 生成刻度位置映射
      const labelPositions = labels.map((_, i) => 
        Math.round((i / (labels.length - 1)) * 100)
      );

      const container = document.createElement('div');
      container.className = 'rating-slider-container';

      // 增强样式
      const style = document.createElement('style');
      style.textContent = `
        /* 保持原有基础样式，修改关键部分 */
        .scale-labels {
          top: 100%;
          height: 20px;
          pointer-events: none;
        }

        .scale-label {
          transform: translateX(-50%) translateY(5px);
          white-space: nowrap;
        }

        /* 新增放大控件样式 */
        .zoom-slider-container {
          position: relative;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }

        .zoom-slider-track {
          height: 4px;
          background: #ddd;
          margin: 25px 0;
          position: relative;
        }

        .zoom-slider-thumb {
          width: 24px;
          height: 24px;
          background: #007AFF;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          cursor: pointer;
        }
      `;
      container.appendChild(style);

      // 创建悬浮放大控件（增强版）
      const createZoomSlider = (option, initialValue) => {
        // 计算初始吸附值
        const snapValue = this.findNearestLabel(initialValue, labelPositions);
        
        const overlay = document.createElement('div');
        overlay.className = 'zoom-overlay';
        
        // 创建自定义滑块轨道
        const track = document.createElement('div');
        track.className = 'zoom-slider-track';
        
        // 创建自定义滑块按钮
        const thumb = document.createElement('div');
        thumb.className = 'zoom-slider-thumb';
        thumb.style.left = `${snapValue}%`;

        // 创建刻度标记
        labels.forEach((label, i) => {
          const mark = document.createElement('div');
          mark.className = 'zoom-scale-mark';
          mark.style.left = `${labelPositions[i]}%`;
          mark.textContent = label;
          track.appendChild(mark);
        });

        // 添加交互逻辑
        let isDragging = false;
        
        const updatePosition = (clientX) => {
          const rect = track.getBoundingClientRect();
          let percent = ((clientX - rect.left) / rect.width) * 100;
          percent = Math.max(0, Math.min(100, percent));
          
          // 吸附到最近刻度
          const snapPercent = this.findNearestLabel(percent, labelPositions);
          thumb.style.left = `${snapPercent}%`;
          valueDisplay.textContent = labels[this.findNearestIndex(snapPercent, labelPositions)];
        };

        thumb.addEventListener('mousedown', () => isDragging = true);
        document.addEventListener('mousemove', (e) => {
          if (isDragging) updatePosition(e.clientX);
        });
        document.addEventListener('mouseup', () => isDragging = false);
        
        track.appendChild(thumb);
        overlay.appendChild(track);
        
        // 其余保持原有逻辑...
      };

      // 工具方法：找到最近刻度
      const findNearestLabel = (value, positions) => {
        return positions.reduce((prev, curr) => 
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      };

      // 工具方法：找到最近刻度索引
      const findNearestIndex = (value, positions) => {
        let minDiff = Infinity;
        let foundIndex = 0;
        
        positions.forEach((pos, i) => {
          const diff = Math.abs(pos - value);
          if (diff < minDiff) {
            minDiff = diff;
            foundIndex = i;
          }
        });
        return foundIndex;
      };

      // 创建滑块行（增强交互）
      options.forEach(option => {
        // ...原有结构...
        
        const updateDisplay = (value) => {
          const snapValue = findNearestLabel(value, labelPositions);
          const labelIndex = findNearestIndex(snapValue, labelPositions);
          valueDisplay.textContent = labels[labelIndex];
          slider.value = snapValue; // 更新实际值
        };

        slider.addEventListener('input', (e) => {
          updateDisplay(parseInt(e.target.value));
        });

        // 初始化显示
        updateDisplay(slider.value);
      });

      // 其余代码保持原有结构...
    } catch (error) {
      console.error("Enhanced RatingSlider Error:", error);
    }
  }
};
