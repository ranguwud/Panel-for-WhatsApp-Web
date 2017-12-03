# Panel for WhatsApp™ Web

This firefox extension adds a button next to your address bar that allows you
to access WhatsApp™ Web in a separate panel without interrupting your workflow.
When the panel is closed, a badge on the button informs you about the number of
unread messages, being always in your view without the need to switch tabs.
To get started, log in into WhatsApp™ Web in the way you are used to.

Please note that this is a hobby project that is supposed to simplify the use of
WhatsApp™ Web. It is not affiliated with WhatsApp™ or WhatsApp™ products, nor is
it endorsed or sponsored by WhatsApp™ in any way. WhatsApp™ is a registered
trademark of Facebook Inc.

Current limitations:

* Every time the panel is opened, the connection to WhatsApp™ Web has to be
re-established. Unfortunately, this cannot be avoided. The reason behind is that
Mozilla has decided to change the programming interface for add-ons with the
release of Firefox 57. One of the changes is that now panels are **forced** to
reload every time they are opened and nothing can be done against it. This also
forces the connection to WhatsApp Web to be reloaded. If you are annoyed by the
reload, you can look at the add-ons
[Web Messenger for WhatsApp™](https://addons.mozilla.org/de/firefox/addon/whatsapp-web-messenger/)
or [WhatsApp Popup](https://addons.mozilla.org/de/firefox/addon/whatsapp-popup/)
(both not mine), which open WhatsApp™ Web in the sidebar or in a separate window,
respectively.

* Due to a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1292701) in the
add-on system of Firefox, it is currently not possible to send images or files.
