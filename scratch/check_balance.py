
import sys

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    braces = 0
    parens = 0
    cur_line = 1
    cur_col = 1
    
    in_string = False
    string_char = ''
    in_comment = False
    comment_type = '' # // or /*
    
    i = 0
    while i < len(content):
        char = content[i]
        
        if not in_string and not in_comment:
            if char == '"' or char == "'" or char == "`":
                in_string = True
                string_char = char
            elif char == '/' and i + 1 < len(content):
                if content[i+1] == '/':
                    in_comment = True
                    comment_type = '//'
                    i += 1
                elif content[i+1] == '*':
                    in_comment = True
                    comment_type = '/*'
                    i += 1
            elif char == '{':
                braces += 1
            elif char == '}':
                braces -= 1
                if braces < 0:
                    print(f"Extra }} at line {cur_line}, col {cur_col}")
            elif char == '(':
                parens += 1
            elif char == ')':
                parens -= 1
                if parens < 0:
                    print(f"Extra ) at line {cur_line}, col {cur_col}")
        elif in_string:
            if char == string_char and content[i-1] != '\\':
                in_string = False
        elif in_comment:
            if comment_type == '//' and char == '\n':
                in_comment = False
            elif comment_type == '/*' and char == '*' and i + 1 < len(content) and content[i+1] == '/':
                in_comment = False
                i += 1
        
        if char == '\n':
            cur_line += 1
            cur_col = 1
        else:
            cur_col += 1
        i += 1
    
    print(f"Final balance: braces={braces}, parens={parens}")

if __name__ == "__main__":
    check_balance(sys.argv[1])
