declare module "react-dropzone" {
  import { ReactNode } from "react";

  export interface FileWithPath extends File {
    path?: string;
  }

  export interface DropzoneOptions {
    onDrop?: (acceptedFiles: File[], rejectedFiles: File[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    maxFiles?: number;
    multiple?: boolean;
    disabled?: boolean;
  }

  export interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFileDialogActive: boolean;
    isFocused: boolean;
  }

  export interface DropzoneRootProps {
    [key: string]: any;
  }

  export interface DropzoneInputProps {
    [key: string]: any;
  }

  export function useDropzone(options?: DropzoneOptions): {
    getRootProps: (props?: DropzoneRootProps) => DropzoneRootProps;
    getInputProps: (props?: DropzoneInputProps) => DropzoneInputProps;
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFileDialogActive: boolean;
    isFocused: boolean;
    rootRef: React.RefObject<HTMLElement>;
    inputRef: React.RefObject<HTMLInputElement>;
    open: () => void;
  };
}
