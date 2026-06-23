import { LucideProps } from "lucide-react";
import React from "react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type FormFieldProps = {
  label: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  placeholder: string;
  value: string;
  endIcon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  onEndIconClick?: () => void;
  onValueChange: (val: string) => void;
  type: "text" | "password";
};
export const FormField = ({
  label,
  icon: Icon,
  placeholder,
  endIcon: EndIcon = undefined,
  onEndIconClick = () => {},
  onValueChange,
  type,
  value,
}: FormFieldProps) => {
  return (
    <div className="">
      <Label>{label}</Label>
      <span className="flex items-center gap-1 bg-background/60 p-1 rounded-md">
        <Button variant={"outline"} type="button">
          <Icon />
        </Button>
        <Input
          className="outline-0! border-0"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
          }}
        />
        {EndIcon && (
          <Button variant={"outline"} onClick={onEndIconClick} type="button">
            <EndIcon />
          </Button>
        )}
      </span>
    </div>
  );
};
