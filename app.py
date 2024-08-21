import os

# Define the path to the js directory
js_directory = './js'

# Initialize a string to hold the markdown content
markdown_content = ""

# Loop through all files in the js directory
for filename in os.listdir(js_directory):
    if filename.endswith(".js"):
        filepath = os.path.join(js_directory, filename)
        
        # Read the content of the JavaScript file
        with open(filepath, 'r', encoding='utf-8') as file:
            file_content = file.read()
        
        # Append the file content to the markdown content with appropriate formatting
        markdown_content += f"### {filename}\n\n"
        markdown_content += "```javascript\n"
        markdown_content += file_content
        markdown_content += "\n```\n\n"

# Write the markdown content to a new file
with open('js_files.md', 'w', encoding='utf-8') as markdown_file:
    markdown_file.write(markdown_content)

print("Markdown file 'js_files.md' created successfully.")
