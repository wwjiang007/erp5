portal = context.getPortalObject()
at_date = at_date.latestTime()

section_uid_list = portal.Base_getSectionUidListForSectionCategory(
  section_category, section_category_strict)

from_date = portal.Base_getAccountingPeriodStartDateForSectionCategory(
  section_category, at_date)

# XXX we need proxy role for that
active_process = portal.portal_activities.newActiveProcess()

priority = 4

#### AccountingTransactionModule_viewFrenchAccountingTransactionFileForPortalType
#kind = 'portal_type'
#kind = 'ledger'
kind = 'portal_type_ledger'

method_kw = {
  'section_uid_list': section_uid_list,
}

activate_kw = {
  'tag': tag,
  'priority': priority,
}

## search_kw
search_kw = {
  'simulation_state': simulation_state,
  'accounting_transaction.section_uid': section_uid_list,
  'operation_date': {'query': (from_date, at_date), 'range': 'minngt' },
}

category_tool = portal.portal_categories
ledger_obj_list = []
if ledger is not None:
  if not (isinstance(ledger, list) or isinstance(ledger, tuple)):
    ledger = (ledger,)

  for item in ledger:
    ledger_obj_list.append(category_tool.ledger.restrictedTraverse(item))

# (journal_code, journal_lib, search_kw)
journal_search_kw_list = []
if kind == 'ledger':
  if not ledger_obj_list:
    for ledger_relative_url, _ in context.AccountingTransactionModule_getLedgerItemList():
      ledger_obj_list.append(category_tool.ledger.restrictedTraverse(ledger_relative_url))

  search_kw['portal_type'] = portal.getPortalAccountingTransactionTypeList()
  for ledger_obj in ledger_obj_list:
    ledger_search_kw = search_kw.copy()
    ledger_search_kw['default_ledger_uid'] = ledger_obj.getUid()
    journal_search_kw_list.append((ledger_obj.getReference() or ledger_obj.getId(), ledger_obj.getReference() or ledger_obj.getId(), ledger_search_kw))

elif kind == 'portal_type_ledger':
  if not ledger_obj_list:
    for ledger_relative_url, _ in context.AccountingTransactionModule_getLedgerItemList():
      ledger_obj_list.append(category_tool.ledger.restrictedTraverse(ledger_relative_url))

  for ledger_obj in ledger_obj_list:
    for portal_type in portal.getPortalAccountingTransactionTypeList():
      portal_type_ledger_search_kw = search_kw.copy()
      portal_type_ledger_search_kw['default_ledger_uid'] = ledger_obj.getUid()
      portal_type_ledger_search_kw['portal_type'] = portal_type
      portal_type_obj = portal.portal_types[portal_type]
      journal_search_kw_list.append(("%s: %s" % (portal_type_obj.getCompactTranslatedTitle(), ledger_obj.getReference() or ledger_obj.getId()),
                                     "%s: %s" % (portal_type_obj.getTranslatedTitle(), ledger_obj.getReference() or ledger_obj.getId()),
                                     portal_type_ledger_search_kw))
   

# kind == 'portal_type'
else:
  if ledger_obj_list:
    search_kw['default_ledger_uid'] = [ ledger_obj.getUid() for ledger_obj in ledger_obj_list ]

  for portal_type in portal.getPortalAccountingTransactionTypeList():
    portal_type_obj = portal.portal_types[portal_type]
    portal_type_search_kw = search_kw.copy()
    portal_type_search_kw['portal_type'] = portal_type
    journal_search_kw_list.append((portal_type_obj.getCompactTranslatedTitle(), portal_type_obj.getTranslatedTitle(), portal_type_search_kw))

## search_kw

for journal_code, journal_lib, search_kw in journal_search_kw_list:
  # XXX we need proxy role for that
  this_journal_active_process = portal.portal_activities.newActiveProcess()

  method_kw['active_process'] = this_journal_active_process.getRelativeUrl()
  portal.portal_catalog.searchAndActivate(
    method_id='AccountingTransaction_postFECExtendedResult', 
    method_kw=method_kw,
    activate_kw=activate_kw,
    **search_kw)

  context.activate(
    tag=aggregate_tag,
    after_tag=tag,
    activity='SQLQueue').AccountingTransactionModule_aggregateFrenchAccountingTransactionFileExtendedForOneJournal(
      journal_code,
      journal_lib,
      active_process=active_process.getRelativeUrl(),
      this_journal_active_process=this_journal_active_process.getRelativeUrl())

#### AccountingTransactionModule_viewFrenchAccountingTransactionFileExtendedForPortalType

context.activate(after_tag=(tag, aggregate_tag)).AccountingTransactionModule_aggregateFrenchAccountingTransactionFile(
  at_date,
  active_process.getRelativeUrl(),
  user_name=user_name)
