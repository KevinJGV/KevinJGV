export default class MotionBlur {
    constructor() {
      this.root = document.body;
      this.cursor = document.querySelector(".curzr-motion");
      this.filter = document.querySelector(".curzr-motion .curzr-motion-blur");
  
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
      
      this.cursorStyle = {
        boxSizing: "border-box",
        position: "fixed",
        top: `${this.cursorSize / -2}px`,
        left: `${this.cursorSize / -2}px`,
        zIndex: "2147483647",
        width: `${this.cursorSize}px`,
        height: `${this.cursorSize}px`,
        borderRadius: "50%",
        overflow: "visible",
        transition: "200ms, transform 20ms",
        userSelect: "none",
        pointerEvents: "none",
      };
  
      this.init(this.cursor, this.cursorStyle);
      this.setupHoverEffect();
      this.setupClickEffect(); 
    }
  
    init(el, style) {
      Object.assign(el.style, style);
      setTimeout(() => {
        this.cursor.removeAttribute("hidden");
      }, 500);
      this.cursor.style.opacity = 1;
    }
  
    move(event) {
      this.previousPointerX = this.position.pointerX;
      this.previousPointerY = this.position.pointerY;
      this.position.pointerX = event.pageX + this.root.getBoundingClientRect().x;
      this.position.pointerY = event.pageY + this.root.getBoundingClientRect().y;
      this.position.distanceX = Math.min(
        Math.max(this.previousPointerX - this.position.pointerX, -20),
        20
      );
      this.position.distanceY = Math.min(
        Math.max(this.previousPointerY - this.position.pointerY, -20),
        20
      );
  
      this.updateTransform();
      this.rotate(this.position);
      this.moving ? this.stop() : (this.moving = true);
    }
  
    rotate(position) {
      let unsortedAngle =
        Math.atan(Math.abs(position.distanceY) / Math.abs(position.distanceX)) *
        this.degrees;
  
      if (isNaN(unsortedAngle)) {
        this.angle = this.previousAngle;
      } else {
        if (unsortedAngle <= 45) {
          if (position.distanceX * position.distanceY >= 0) {
            this.angle = +unsortedAngle;
          } else {
            this.angle = -unsortedAngle;
          }
          this.filter.setAttribute(
            "stdDeviation",
            `${Math.abs(this.position.distanceX / 2)}, 0`
          );
        } else {
          if (position.distanceX * position.distanceY <= 0) {
            this.angle = 180 - unsortedAngle;
          } else {
            this.angle = unsortedAngle;
          }
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
      setTimeout(() => {
        this.filter.setAttribute("stdDeviation", "0, 0");
        this.moving = false;
      }, 50);
    }
  
    hidden() {
      this.cursor.style.opacity = 0;
      setTimeout(() => {
        this.cursor.setAttribute("hidden", "hidden");
      }, 500);
    }
  
    setupHoverEffect() {
        const targets = [...document.querySelectorAll("a"), document.querySelector("nav"), document.querySelector("#bot-menu")];
        console.log(document.querySelector("#tools"));
        targets.forEach(target => {
          if (target) {
            target.addEventListener("mouseenter", () => {
              this.isHovered = true;
              this.updateTransform();
            });
            target.addEventListener("mouseleave", () => {
              this.isHovered = false;
              this.updateTransform();
            });
          }
        });
      }

      setupClickEffect() {
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
      
  
      updateTransform() {
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