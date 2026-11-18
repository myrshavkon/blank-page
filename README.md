blank page (but make it yours)

a  little writing app. inspired by https://www.blank.page, except:

    no sign in. none. don't even think about it.
   
    as many notes/chats as you want. go wild.
    
    no sharing. nothing leaves your browser. like, literally nothing.
    
    everything saves to your browser's localStorage. that's it. no server, no database, no cloud, no "we'll get back to you."



basically, you open the file, you write, it stays on your machine. the end.
what's in here
text

index.html   <- the page itself

style.css    <- all the looks

app.js       <- all the brains (notes, sidebar, settings, saving)

prepaint.js  <- tiny script that sets the theme/font before the page paints so you don't get a flash of the wrong colors




that's the whole project. no node_modules, no build step, no npm install, no nothing. just open the file.
how to use it

    open  in your browser. 
    
    write.
    
    that's kinda it.




the sidebar

it's hidden by default so you get a clean blank page. click the ☰ thing in the top-left (or hit Ctrl/Cmd + B) and it slides in smoothly. click the ✕, click the dim background, or hit Esc to close it again.

in the sidebar:

    + New note — makes a new blank note

    each note shows its title, word count, and when you last touched it
    
    hover a note and you'll see a button to rename and a delete button
    
    you can also double-click a note's title to rename it
    
    titles are optional — if you don't set one, it just uses the first line of your note. clear the title field and it goes back to doing that automatically.




settings 

    theme — light / dark / system (follows your OS)
    
    typeface — sans, serif, or mono (same fonts blank.page uses)
    
    text size — S / M / L
    
    download note (.txt) — saves the current note as a text file. use this if you want a backup that isn't stuck in your 
    browser.
    
    print / save as PDF — your browser's print dialog, but only the note (sidebar and toolbars are hidden when printing)

settings also get saved to localStorage, so they stick the next time you open it.



keyboard shortcuts

shortcut does

Ctrl/Cmd + B	toggle the sidebar

Ctrl/Cmd + Alt + N	new note (and opens the sidebar)

Esc	close the sidebar / dismiss menus

when renaming a note: Enter saves, Esc cancels.



FAQ:

where does my stuff get saved?

in your browser's localStorage, under two keys:

    blankpage.notes.v1 — your notes (text + titles + timestamps)
    settings — theme, font, text size

so:

    it's on this device, in this browser, for this file's origin only. chrome won't see firefox's notes, and file:///.../index.html won't see notes from a hosted version.
    clearing your browser data wipes them. private/incognito mode throws them away when you close the window. there's no recovery because there's no server. if you care about a note, use download note (.txt).
    localStorage gives you ~5–10MB per origin, which is a ridiculous amount of plain text. you will not hit it in normal use.


is this a copy of blank.page?

it's a clone of the vibe — same minimal editor, same fonts, same theme tokens, same favicon. but a bunch of stuff is different on purpose:

    no sign in — removed entirely
    infinite notes instead of one document at a time, with a sidebar to switch between them
    no sharing / no sync / no cloud — everything stays local
    inline note renaming — name your notes whatever you want

so it's blank.page's quiet, focused writing surface, minus the account stuff, plus your own little pile of notes that never leave your machine.
stuff it does not do (and isn't supposed to)

    no accounts, no login, no "forgot password"
    no syncing across devices
    no sharing links
    no rich text / markdown rendering — it's plain text, deliberately
    no images or attachments
    no backend, no server, no API, no database

if you want any of that, this ain't the app. and that's the point.



license / whatever

do whatever you want with it. it's a few files. copy it, change it, host it, rename it, throw it on a USB stick. just don't blame me if you clear your browser and lose your stuff — back up the stuff you care about.



## if you want new features or have any issues somehow just open an issue and I will check it out