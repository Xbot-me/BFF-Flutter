// app/api/payments/iframe-communicator/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
<title>IFrame Communicator</title>
<script type="text/javascript">
  function callParentFunction(str) {
    if (
      str && str.length > 0 &&
      window.parent && window.parent.parent &&
      window.parent.parent.CommunicationHandler &&
      window.parent.parent.CommunicationHandler.onReceiveCommunication
    ) {
      var referrer = document.referrer;
      window.parent.parent.CommunicationHandler.onReceiveCommunication({
        qstr: str,
        parent: referrer
      });
    }
  }
  function receiveMessage(event) {
    if (event && event.data) {
      callParentFunction(event.data);
    }
  }
  if (window.addEventListener) {
    window.addEventListener("message", receiveMessage, false);
  } else if (window.attachEvent) {
    window.attachEvent("onmessage", receiveMessage);
  }
  if (window.location.hash && window.location.hash.length > 1) {
    callParentFunction(window.location.hash.substring(1));
  }
</script>
</head>
<body></body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      // Must NOT have X-Frame-Options: SAMEORIGIN or Auth.net can't embed it
      "X-Frame-Options": "ALLOWALL",
    },
  });
}