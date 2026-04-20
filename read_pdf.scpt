use framework "Foundation"
use framework "Quartz"
use scripting additions

on run argv
	set thePath to item 1 of argv
	set theURL to current application's NSURL's fileURLWithPath:thePath
	set thePDF to current application's PDFDocument's alloc()'s initWithURL:theURL
	return (thePDF's string()) as string
end run
