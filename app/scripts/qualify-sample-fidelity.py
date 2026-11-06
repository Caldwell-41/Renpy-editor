"""Explicit L20 normal-game proof, offline preflight or exact comparison."""
import json

import fidelity_reference
from sample_fidelity import FIXTURE_ROOT, OUTCOME, assets, compare, validate_accepted
from fidelity_comparison import inputs


def initializer(accepted, cases, output):
    variables = json.loads(accepted['files']['.renpy-editor/authoring.json']['text'])['variables']
    for case in cases:
        samples = {row['variableId']: row['value'] for row in case['request']['variableSamples']}
        values = {}
        for variable in variables:
            value = samples.get(variable['id'], variable['defaultValue'])
            kind = variable['variableType']
            assert kind in ('int', 'bool', 'string')
            if kind == 'int':
                value = int(value)
            elif kind == 'bool':
                assert type(value) is bool
            else:
                assert isinstance(value, str)
            values[variable['technicalName']] = value
        case['values'] = values
    return dict(SAMPLE_CASES=cases, SAMPLE_INPUTS=inputs(accepted), SAMPLE_OUTPUT=str(output))


PROOF = fidelity_reference.Proof(
    name='sample', outcome=OUTCOME, assets=assets, admit=validate_accepted, initializer=initializer, compare=compare,
    inputs=('app/src', 'app/scripts/sample_fidelity.py', 'app/scripts/qualify-sample-fidelity.py',
            str(FIXTURE_ROOT / 'sample-fidelity.rpy'), str(FIXTURE_ROOT / 'control-states')),
    # Kept from the qualified L20 campaign; L19 ran without it.
    env=dict(RENPY_HIGHDPI='1.0'))

if __name__ == '__main__':
    fidelity_reference.main(PROOF, __doc__)
