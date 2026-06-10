' context_lake/hooks/start-watch-silent.vbs
' Launches Context Lake watch silently (no console window) using pythonw.exe
' Required for truly background operation on Windows.
'
' Usage: Double-click or call from startup script.
'        wscript.exe "context_lake\hooks\start-watch-silent.vbs"

Dim shell, projectRoot, scriptPath, pythonwPath

' Resolve project root (two levels up from hooks/)
projectRoot = CreateObject("Scripting.FileSystemObject").GetAbsolutePathName( _
    CreateObject("Scripting.FileSystemObject").GetFile(WScript.ScriptFullName).ParentFolder & "\..\.." _
)

scriptPath = projectRoot & "\context_lake\capture.py"

' Find pythonw.exe (prefer PATH, fallback to common installs)
pythonwPath = "pythonw.exe"

Dim fso, pythonwCheck
Set fso = CreateObject("Scripting.FileSystemObject")
If Not fso.FileExists(pythonwPath) Then
    Dim candidates
    candidates = Array( _
        "C:\Python314\pythonw.exe", _
        "C:\Python313\pythonw.exe", _
        "C:\Python312\pythonw.exe", _
        "C:\Python311\pythonw.exe", _
        "C:\Python310\pythonw.exe", _
        "C:\Users\ADMIN\AppData\Local\Programs\Python\Python314\pythonw.exe", _
        "C:\Users\ADMIN\AppData\Local\Programs\Python\Python313\pythonw.exe", _
        "C:\Users\ADMIN\AppData\Local\Programs\Python\Python312\pythonw.exe" _
    )
    For Each c In candidates
        If fso.FileExists(c) Then
            pythonwPath = c
            Exit For
        End If
    Next
End If

' Launch pythonw.exe with no window, passing explicit project root
Set shell = CreateObject("WScript.Shell")
shell.Run """" & pythonwPath & """ """ & scriptPath & """ --watch --window ""context-lake-watch"" --project-root """ & projectRoot & """", 0, False
