import { yellow } from "https://deno.land/std@0.126.0/fmt/colors.ts";

export function info(message: string): void {
  console.log(`${yellow("[INFO]")} ${message}`);
}
