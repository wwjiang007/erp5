#############################################################################
#
# Copyright (c) 2018 Nexedi SA and Contributors. All Rights Reserved.
#                    Vincent Pelletier <vincent@nexedi.com>
#
# WARNING: This program as such is intended to be used by professional
# programmers who take the whole responsability of assessing all potential
# consequences resulting from its eventual inadequacies and bugs
# End users who are looking for a ready-to-use solution with commercial
# garantees and support are strongly adviced to contract a Free Software
# Service Company
#
# This program is Free Software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
#
##############################################################################
from AccessControl import ClassSecurityInfo
from Products.ERP5Type.Globals import InitializeClass

class ImmediateReindexContextManager(object):
  """
  Immediately reindex given object(s) upon leaving context.

  Pass an instance of this class as "immediate_reindex" argument on methods
  having one to delay indexation a bit (ex: to let you change object state,
  change some peroperties).

  Example usage:
  from Products.ERP5Type.ImmediateReindexContextManager import ImmediateReindexContextManager
  with ImmediateReindexContextManager() as immediate_reindex_context_manager:
    document = context.newContent(
      immediate_reindex=immediate_reindex_context_manager,
      ...
    )
    document.confirm()
  # document will be indexed as already confirmed
  """
  security = ClassSecurityInfo()

  def __init__(self):
    # Detect and tolerate (but track) context nesting.
    self.__context_stack = []

  def __enter__(self):
    self.__context_stack.append([])
    return self

  def __exit__(self, exc_type, exc_value, traceback):
    for document in self.__context_stack.pop():
      document.immediateReindexObject()

  security.declarePrivate('append')
  def append(self, document):
    """
    Queue document for reindexation upon context exit.

    May only be called by places which just bound document into its container,
    like constructInstance or object paste handler.
    DO NOT CALL THIS ANYWHERE ELSE !
    """
    try:
      self.__context_stack[-1].append(document)
    except IndexError:
      raise RuntimeError(
        'ImmediateReindexContextManager must be entered '
        '(see "with" statement) before it can be used',
      )

InitializeClass(ImmediateReindexContextManager)
