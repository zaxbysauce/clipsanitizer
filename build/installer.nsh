!macro customInstall
  CreateShortcut /NoWorkingDir "$SENDTO\ClipSanitizer.lnk" "$INSTDIR\ClipSanitizer.exe" "" "$INSTDIR\resources\assets\icons\win\icon.ico" 0
!macroend

!macro customUninstall
  Delete "$SENDTO\ClipSanitizer.lnk"
!macroend
