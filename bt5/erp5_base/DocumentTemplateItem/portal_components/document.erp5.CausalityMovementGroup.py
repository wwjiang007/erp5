
##############################################################################
#
# Copyright (c) 2008 Nexedi SA and Contributors. All Rights Reserved.
#
# WARNING: This program as such is intended to be used by professional
# programmers who take the whole responsibility of assessing all potential
# consequences resulting from its eventual inadequacies and bugs
# End users who are looking for a ready-to-use solution with commercial
# guarantees and support are strongly adviced to contract a Free Software
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
# Foundation, Inc., 51 Franklin Street - Fifth Floor, Boston, MA 02110-1301, USA.
#
##############################################################################

from erp5.component.document.MovementGroup import MovementGroup

class CausalityMovementGroup(MovementGroup):
  """
  The purpose of MovementGroup is to define how movements are grouped,
  and how values are updated from simulation movements.
  """
  meta_type = 'ERP5 Causality Movement Group'
  portal_type = 'Causality Movement Group'


  def _getPropertyDict(self, movement, **kw):
    return {'_explanation': self._getExplanationRelativeUrl(movement)}

  def test(self, movement, property_dict, **kw):
    # we don't care the difference of explanation url when updating
    #return True, property_dict
    return True, {}

  def _getExplanationRelativeUrl(self, movement):
    """ Get the order value for a movement """
    if hasattr(movement, 'getParentValue'):
      # This is a simulation movement
      if movement.getParentValue() != movement.getRootAppliedRule() :
        # get the explanation of parent movement if we have not been
        # created by the root applied rule.
        movement = movement.getParentValue().getParentValue()
      explanation_value = movement.getExplanationValue()
      if explanation_value is None:
        raise ValueError('No explanation for movement %s' % movement.getPath())
    else:
      # This is a temp movement
      explanation_value = None
    if explanation_value is None:
      explanation_relative_url = None
    else:
      # get the enclosing delivery for this cell or line
      if hasattr(explanation_value, 'getExplanationValue') :
        explanation_value = explanation_value.getExplanationValue()

      explanation_relative_url = explanation_value.getRelativeUrl()
    return explanation_relative_url
