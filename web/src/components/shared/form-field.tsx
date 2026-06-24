import { LucideProps } from "lucide-react";
import React from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { TiptapTextArea } from "./tiptap/textarea";

type FormFieldProps = {
  label: string;
  icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  placeholder: string;
  value: string;
  endIcon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  onEndIconClick?: () => void;
  onValueChange: (val: string) => void;
  type: "text" | "password" | "textarea";
  rows?: number;
};
export const FormField = ({
  label,
  icon: Icon = undefined,
  placeholder,
  endIcon: EndIcon = undefined,
  onEndIconClick = () => {},
  onValueChange,
  type,
  value,
  rows = 4,
}: FormFieldProps) => {
  const isTextarea = type === "textarea";
  return (
    <div className="">
      <Label>{label}</Label>
      <span
        className={`flex gap-1 bg-background/60 p-1 rounded-md ${
          isTextarea ? "items-start" : "items-center"
        }`}
      >
        {!isTextarea && Icon && (
          <Button variant={"outline"} type="button">
            <Icon />
          </Button>
        )}
        {isTextarea ? (
          <Textarea
            className="outline-0! border-0 shadow-none focus-visible:ring-0 resize-none"
            placeholder={placeholder}
            value={value}
            rows={rows}
            onChange={(e) => {
              onValueChange(e.target.value);
            }}
          />
        ) : (
          <Input
            className="outline-0! border-0"
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onValueChange(e.target.value);
            }}
          />
        )}
        {EndIcon && (
          <Button variant={"outline"} onClick={onEndIconClick} type="button">
            <EndIcon />
          </Button>
        )}
      </span>
    </div>
  );
};
