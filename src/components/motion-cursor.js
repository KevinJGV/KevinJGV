export default class MotionCursor {
  constructor() {
      if (typeof window === 'undefined') return;
      
      // Inicializar el cursor
      this.init();
  }

  init() {
      this.root = document.body;
      this.cursor = document.querySelector(".curzr-motion");
      this.filter = document.querySelector(".curzr-motion .curzr-motion-blur");

      if (!this.cursor || !this.filter) {
          console.error("Cursor elements not found");
          return;
      }

      // Inicializar propiedades
      this.setupProperties();
      // Configurar estilos
      this.setupStyles();
      // Configurar event listeners
      this.setupEventListeners();
  }

  setupProperties() {
      this.position = {
          distanceX: 0,
          distanceY: 0,
          pointerX: 0,
          pointerY: 0,
      };
      this.previousPointerX = 0;
      this.previousPointerY = 0;
      this.angle = 0;
      this.previousAngle = 0;
      this.angleDisplace = 0;
      this.degrees = 57.296;
      this.cursorSize = 15;
      this.moving = false;
      this.isHovered = false;
      this.isPressed = false;
  }

  setupStyles() {
      const cursorStyle = {
          opacity: 1,
          position: 'fixed',
          boxSizing: 'border-box',
          top: `${this.cursorSize / -2}px`,
          left: `${this.cursorSize / -2}px`,
          zIndex: '2147483647',
          width: `${this.cursorSize}px`,
          height: `${this.cursorSize}px`,
          borderRadius: '50%',
          overflow: 'visible',
          transition: '200ms, transform 20ms',
          userSelect: 'none',
          pointerEvents: 'none'
      };

      Object.assign(this.cursor.style, cursorStyle);
      this.cursor.removeAttribute("hidden");
  }

  setupEventListeners() {
      // Limpiar listeners anteriores si existen
      this.clearEventListeners();

      // Seleccionar elementos interactivos
      const interactiveElements = [
          ...document.querySelectorAll("a, button, input, select, textarea"),
          document.querySelector("nav"),
          document.querySelector("#bot-menu")
      ].filter(Boolean);

      // Configurar eventos para elementos interactivos
      interactiveElements.forEach(element => {
          element.addEventListener("mouseenter", () => {
              this.isHovered = true;
              this.updateTransform();
          });

          element.addEventListener("mouseleave", () => {
              this.isHovered = false;
              this.updateTransform();
          });
      });

      // Configurar eventos de click
      document.addEventListener("mousedown", () => {
          this.isPressed = true;
          this.updateTransform();
      });

      document.addEventListener("mouseup", () => {
          this.isPressed = false;
          this.updateTransform();
      });

      document.addEventListener("mouseleave", () => {
          this.isPressed = false;
          this.updateTransform();
      });
  }

  clearEventListeners() {
      const elements = document.querySelectorAll("a, button, input, select, textarea, nav, #bot-menu");
      elements.forEach(element => {
          element?.replaceWith(element.cloneNode(true));
      });
  }

  move(event) {
      if (!this.cursor || !this.filter) return;

      // Calcular posición
      this.previousPointerX = this.position.pointerX;
      this.previousPointerY = this.position.pointerY;
      
      // Ajustar posición considerando el scroll
      this.position.pointerX = event.pageX - window.scrollX;
      this.position.pointerY = event.pageY - window.scrollY;
      
      // Calcular distancia
      this.position.distanceX = Math.min(
          Math.max(this.previousPointerX - this.position.pointerX, -20),
          20
      );
      this.position.distanceY = Math.min(
          Math.max(this.previousPointerY - this.position.pointerY, -20),
          20
      );

      // Actualizar cursor
      this.updateTransform();
      this.rotate(this.position);
      
      // Manejar movimiento
      if (this.moving) {
          this.stop();
      } else {
          this.moving = true;
      }
  }

  rotate(position) {
      if (!this.cursor || !this.filter) return;

      const unsortedAngle = Math.atan(
          Math.abs(position.distanceY) / Math.abs(position.distanceX)
      ) * this.degrees;

      if (isNaN(unsortedAngle)) {
          this.angle = this.previousAngle;
      } else {
          if (unsortedAngle <= 45) {
              this.angle = position.distanceX * position.distanceY >= 0
                  ? +unsortedAngle
                  : -unsortedAngle;
              this.filter.setAttribute(
                  "stdDeviation",
                  `${Math.abs(this.position.distanceX / 2)}, 0`
              );
          } else {
              this.angle = position.distanceX * position.distanceY <= 0
                  ? 180 - unsortedAngle
                  : unsortedAngle;
              this.filter.setAttribute(
                  "stdDeviation",
                  `${Math.abs(this.position.distanceY / 2)}, 0`
              );
          }
      }

      this.cursor.style.transform += ` rotate(${this.angle}deg)`;
      this.previousAngle = this.angle;
  }

  stop() {
      if (!this.filter) return;
      
      setTimeout(() => {
          this.filter.setAttribute("stdDeviation", "0, 0");
          this.moving = false;
      }, 50);
  }

  updateTransform() {
      if (!this.cursor) return;

      let scale = "scale(1)";
      
      if (this.isHovered) {
          scale = " scale(2)";
      }
      if (this.isPressed) {
          scale = " scale(0.8)";
      }
      if (this.isHovered && this.isPressed) {
          scale = " scale(1.5)";
      }

      this.cursor.style.transform = `translate3d(${this.position.pointerX}px, ${this.position.pointerY}px, 0)${scale} rotate(${this.angle}deg)`;
  }
}