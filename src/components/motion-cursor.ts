interface Position {
  distanceX: number;
  distanceY: number;
  pointerX: number;
  pointerY: number;
}

export default class MotionCursor {
  private root: HTMLElement | null = null;
  private cursor: HTMLElement | null = null;
  private filter: SVGElement | null = null;
  private position!: Position;
  private previousPointerX: number = 0;
  private previousPointerY: number = 0;
  private angle: number = 0;
  private previousAngle: number = 0;
  private angleDisplace: number = 0;
  private readonly degrees: number = 57.296;
  private readonly cursorSize: number = 15;
  private moving: boolean = false;
  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor() {
    if (typeof window === "undefined") return;
    this.init();
  }

  private init(): void {
    this.root = document.body;
    this.cursor = document.querySelector<HTMLElement>(".curzr-motion");
    this.filter = document.querySelector<SVGElement>(".curzr-motion .curzr-motion-blur");

    if (!this.cursor || !this.filter) {
      console.error("Cursor elements not found");
      return;
    }

    this.setupProperties();
    this.setupStyles();
    this.setupEventListeners();
  }

  private setupProperties(): void {
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
    this.moving = false;
    this.isHovered = false;
    this.isPressed = false;
  }

  private setupStyles(): void {
    if (!this.cursor) return;
    const cursorStyle: Partial<CSSStyleDeclaration> = {
      opacity: "1",
      position: "fixed",
      boxSizing: "border-box",
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
    Object.assign(this.cursor.style, cursorStyle);
    this.cursor.removeAttribute("hidden");
  }

  private setupEventListeners(): void {
    this.clearEventListeners();

    const interactiveElements: Element[] = [
      ...document.querySelectorAll("a, button, input, select, textarea"),
      document.querySelector("nav"),
      document.querySelector("#bot-menu"),
    ].filter((el): el is Element => el !== null);

    interactiveElements.forEach((element) => {
      element.addEventListener("mouseenter", () => {
        this.isHovered = true;
        this.updateTransform();
      });
      element.addEventListener("mouseleave", () => {
        this.isHovered = false;
        this.updateTransform();
      });
    });

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

  private clearEventListeners(): void {
    const elements = document.querySelectorAll(
      "a, button, input, select, textarea, nav, #bot-menu"
    );
    elements.forEach((element) => {
      element?.replaceWith(element.cloneNode(true));
    });
  }

  public move(event: MouseEvent): void {
    if (!this.cursor || !this.filter) return;

    this.previousPointerX = this.position.pointerX;
    this.previousPointerY = this.position.pointerY;

    this.position.pointerX = event.pageX - window.scrollX;
    this.position.pointerY = event.pageY - window.scrollY;

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

    if (this.moving) {
      this.stop();
    } else {
      this.moving = true;
    }
  }

  private rotate(position: Position): void {
    if (!this.cursor || !this.filter) return;

    const unsortedAngle =
      Math.atan(Math.abs(position.distanceY) / Math.abs(position.distanceX)) *
      this.degrees;

    if (isNaN(unsortedAngle)) {
      this.angle = this.previousAngle;
    } else {
      if (unsortedAngle <= 45) {
        this.angle =
          position.distanceX * position.distanceY >= 0
            ? +unsortedAngle
            : -unsortedAngle;
        this.filter.setAttribute(
          "stdDeviation",
          `${Math.abs(this.position.distanceX / 2)}, 0`
        );
      } else {
        this.angle =
          position.distanceX * position.distanceY <= 0
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

  private stop(): void {
    if (!this.filter) return;
    setTimeout(() => {
      this.filter?.setAttribute("stdDeviation", "0, 0");
      this.moving = false;
    }, 50);
  }

  private updateTransform(): void {
    if (!this.cursor) return;

    let scale = "scale(1)";
    if (this.isHovered) scale = " scale(2)";
    if (this.isPressed) scale = " scale(0.8)";
    if (this.isHovered && this.isPressed) scale = " scale(1.5)";

    this.cursor.style.transform = `translate3d(${this.position.pointerX}px, ${this.position.pointerY}px, 0)${scale} rotate(${this.angle}deg)`;
  }
}
