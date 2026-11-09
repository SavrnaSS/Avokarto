// Custom type declarations for third-party libraries without official types

declare module 'bootstrap/dist/js/bootstrap.esm' {
  const bootstrap: unknown;
  export default bootstrap;
}

declare module 'bootstrap' {
  export class Tooltip {
    constructor(element: Element, options?: Tooltip.Options);
    static getInstance(element: Element): Tooltip | null;
    dispose(): void;
  }
  
  namespace Tooltip {
    interface Options {
      title?: string;
      placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
      trigger?: string;
      offset?: [number, number];
      template?: string;
    }
  }
}

declare module 'drift-zoom' {
  export default class Drift {
    constructor(el: HTMLElement, options?: Record<string, unknown>);
    destroy(): void;
  }
}

declare module '@cloudimage/360-view' {
  export default class CloudImage360View {
    init(container: HTMLElement, options?: Record<string, unknown>): void;
  }
}

declare module 'odometer' {
  export default class Odometer {
    constructor(options: { el: HTMLElement; value?: number; format?: string });
    update(value: number): void;
  }
}
