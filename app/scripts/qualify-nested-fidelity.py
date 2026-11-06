"""Explicit L19 normal-game proof, offline preflight or exact comparison."""
import json

import fidelity_reference
from nested_fidelity import ASSETS, FIXTURE_ROOT, FIXTURES, OUTCOME, compare, validate_accepted
from fidelity_comparison import inputs


def assets():
    return {path: (FIXTURE_ROOT / fixture).read_bytes() for path, fixture in ASSETS.values()}


def initializer(accepted, cases, output):
    case, = cases
    data = dict(NESTED_CASE=case, NESTED_INPUTS=inputs(accepted), NESTED_OUTPUT=str(output))
    variables = json.loads(accepted['files']['.renpy-editor/authoring.json']['text'])['variables']
    for sample in case['request']['variableSamples']:
        variable = next(variable for variable in variables if variable['id'] == sample['variableId'])
        assert variable['technicalName'] == 'nested_caption' and isinstance(sample['value'], str)
        data['NESTED_SAMPLE'] = sample['value']
    return data


PROOF = fidelity_reference.Proof(
    name='nested', outcome=OUTCOME, assets=assets, admit=validate_accepted, initializer=initializer, compare=compare,
    inputs=('app/scripts/nested_fidelity.py', 'app/scripts/qualify-nested-fidelity.py',
            *[str(FIXTURE_ROOT / name) for name in FIXTURES.values()]))

if __name__ == '__main__':
    fidelity_reference.main(PROOF, __doc__)
