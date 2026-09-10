export type ToolOperation = "analyze" | "normalize";
export type ToolErrorCode = "processing_failed" | "worker_failed";
export type ToolEventName = "tool_start" | "tool_success" | "tool_error";

type ToolEventParams = {
  tool_id: "audio-loudness";
  operation: ToolOperation;
  measurement_version: 1;
  site_revision: string;
  error_code?: ToolErrorCode;
};

export type ToolEventReporterOptions = {
  siteRevision?: string;
  send?: (name: ToolEventName, params: ToolEventParams) => void;
};

export type ToolEventHandle = {
  success(): void;
  error(errorCode: ToolErrorCode | string): void;
  cancel(): void;
};

const SITE_REVISION = /^[a-f0-9]{40}$/;
const operations = new Set<string>(["analyze", "normalize"]);
const errorCodes = new Set<string>(["processing_failed", "worker_failed"]);

export function createToolEventReporter(options: ToolEventReporterOptions): {
  start(operation: ToolOperation | string): ToolEventHandle;
} {
  const enabled = typeof options.siteRevision === "string" && SITE_REVISION.test(options.siteRevision);
  const siteRevision = options.siteRevision;
  let active: { active: boolean } | undefined;

  const emit = (name: ToolEventName, operation: ToolOperation, errorCode?: ToolErrorCode): void => {
    if (!enabled || typeof siteRevision !== "string" || options.send === undefined) {
      return;
    }

    const params: ToolEventParams = {
      tool_id: "audio-loudness",
      operation,
      measurement_version: 1,
      site_revision: siteRevision,
      ...(errorCode === undefined ? {} : { error_code: errorCode }),
    };
    try {
      options.send(name, params);
    } catch {
      // Event delivery is optional and must never affect the tool operation.
    }
  };

  const inertHandle: ToolEventHandle = {
    success: () => undefined,
    error: () => undefined,
    cancel: () => undefined,
  };

  return {
    start(operation: ToolOperation | string): ToolEventHandle {
      if (!enabled || !operations.has(operation)) {
        return inertHandle;
      }

      if (active !== undefined) {
        active.active = false;
      }
      const attempt = { active: true };
      active = attempt;
      const validOperation = operation as ToolOperation;
      emit("tool_start", validOperation);

      return {
        success: () => {
          if (!attempt.active) {
            return;
          }
          attempt.active = false;
          emit("tool_success", validOperation);
        },
        error: (errorCode: ToolErrorCode | string) => {
          if (!attempt.active || !errorCodes.has(errorCode)) {
            return;
          }
          attempt.active = false;
          emit("tool_error", validOperation, errorCode as ToolErrorCode);
        },
        cancel: () => {
          attempt.active = false;
        },
      };
    },
  };
}
