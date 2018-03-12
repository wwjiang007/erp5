# Return first listbox in a form that is enabled and not hidden
# Christophe Dumez <christophe@nexedi.com>
# This script should be used to detect a listbox without having to name it "listbox"

def isListBox(field):
  if field.meta_type == "ListBox":
    return True
  elif field.meta_type == "ProxyField":
    template_field = field.getRecursiveTemplateField()
    if template_field.meta_type == "ListBox":
      return True
  return False


if form is None:
  form = context

if form.meta_type != 'ERP5 Form':
  return None

if form.has_field('listbox'):
  return form.get_field('listbox')

# we start with 'bottom' because most of the time
# the listbox is there.
for group in ('bottom', 'center', 'left', 'right'):
  for field in form.get_fields_in_group(group):
     if (isListBox(field) and
         not field.get_value('hidden') and
         field.get_value('enabled')):
        return field
