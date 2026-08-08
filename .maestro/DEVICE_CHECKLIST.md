# Physical device checklist

Run the automated Maestro flows first, then complete this matrix on a current Android phone and at
least one small and one large iPhone viewport.

| Area                                | Android                                                      | iPhone                                                |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Fresh install and update over 0.4.0 | Verify APK install and retained data                         | Verify Xcode install and retained data between builds |
| Offline restart                     | Create data, enable airplane mode, force close, reopen       | Same                                                  |
| Photo picker                        | Select, view, replace and remove a task photo and background | Same; verify the Photos permission text               |
| File transfer                       | Share and open `.sheettodo` from Files and a messenger       | Share and open from Files and Share Sheet             |
| Alarm permission                    | Notification plus exact-alarm permission                     | Notification permission only                          |
| Alarm in foreground                 | Full-screen alarm and stop action                            | Alarm screen and Time Sensitive notification          |
| Alarm in background                 | Full-screen alarm, looping sound and stop action             | Notification sound, open action and stop action       |
| Cold-start notification             | Opens the alarm screen                                       | Notification tap opens the alarm screen               |
| Navigation                          | System and predictive back                                   | Edge-swipe back and header back                       |
| Layout                              | Narrow phone and tablet-width responsive layout              | iPhone SE-size and Pro Max-size layouts               |

Record the OS version, device model, build profile and result for each run. iOS does not support the
Android full-screen alarm or indefinitely looping notification sound.
