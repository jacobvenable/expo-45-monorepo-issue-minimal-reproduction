import * as React from "react";
// @ts-ignore
import { Text } from "react-native";

import sanitizeHtml, { IOptions } from "sanitize-html";

const useSanitizeHtml = (
  content: string,
  options: IOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["style"]),
    allowedAttributes: (sanitizeHtml.defaults.allowedAttributes = {
      "*": ["style", "class", "lang", "href", "data-native-link"],
    }),
  }
) => {
  return sanitizeHtml(content, options);
};

export function MyView() {
  const why = useSanitizeHtml("why are we using this?");

  return <Text>Hello from the first package</Text>;
}
