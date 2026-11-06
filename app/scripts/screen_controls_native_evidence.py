"""Admission for the existing packaged-WebView runner's screen-control case."""
import re
from uuid import UUID


STATES = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
PREFIXES = ('idle', 'hover', 'selected_idle', 'selected_hover', 'insensitive', 'selected_insensitive')


def controls_details_ok(details):
    owner, source = details.get('identity'), details.get('acceptedSource')
    binding, appearances = details.get('binding'), details.get('appearances')
    if (not isinstance(owner, dict) or owner.get('name') != 'travel_notes'
            or owner.get('path') != 'game/ui/travel_notes.rpy' or owner.get('kind') != 'dialog'
            or owner.get('resolved') is not True or details.get('nativeWebView') is not True
            or details.get('sdkExecuted') is not False or details.get('imageDecoded') is not True
            or details.get('error') or not isinstance(source, str) or len(source.encode()) > 65536
            or not isinstance(binding, dict) or binding.get('minimum') != '-10' or binding.get('maximum') != '90'
            or not isinstance(appearances, dict) or set(appearances) != set(STATES)):
        return False
    try:
        identities = details['identities']
        if (not isinstance(identities, list) or len(identities) != 3 or len(set(identities)) != 3
                or identities[0] != owner['rootId'] or owner['id'] in identities
                or any(str(UUID(value)) != value for value in [owner['id'], binding['variableId'], *identities])):
            return False
        for reference in appearances.values():
            if (not isinstance(reference, dict) or str(UUID(reference['assetId'])) != reference['assetId']
                    or not re.fullmatch('[a-f0-9]{64}', reference['expectedAssetSha256'])
                    or reference.get('replacementSha256') is not None):
                return False
    except (ValueError, TypeError, KeyError, AttributeError):
        return False
    return (source.count(f'# loomlight-screen: {owner["id"]}\n') == 1
            and source.count('screen travel_notes():\n') == 1
            and all(source.count(f'# loomlight-element: {identity}\n') == 1 for identity in identities[1:])
            and 'VariableValue("coins", min=-10, max=90, step=1, force_step=True)' in source
            and 'xsize 360' in source and 'ysize 24' in source
            and source.count('Transform(') == 6
            and all(f'{prefix} Transform("images/ui station_seal.png", xysize=(300, 80))' in source for prefix in PREFIXES)
            and 'SetVariable("coins", 21)' in source and 'Return()' in source
            and 'use source_only_footer()' in source and 'text "Protected neighbor"' in source)
