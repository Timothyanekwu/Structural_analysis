import models
import validator
from typing import List, Tuple
# Description:
# Converts your partner’s raw numerical inputs into structured objects (BeamConfig, Load, Support) which the rest of your pipeline expects.

def build_inputs(beam_length: float,
                 raw_loads: List[Tuple[float, float]],
                 raw_supports: List[Tuple[float, float]]
                ) -> Tuple[models.BeamConfig, List[models.Load], List[models.Support]]:
    validator.validate_inputs(beam_length, raw_supports, raw_loads)   
    Loads = build_loads(raw_loads)
    Supports = build_supports(raw_supports)
    Beam = models.BeamConfig(beam_length)
    return Beam, Loads, Supports
 

def build_loads(raw_loads):
    structured_loads = []
    for item in raw_loads:
        position, magnitude = item
        structured_loads.append(models.Load(position, magnitude))
    return structured_loads

def build_supports(raw_supports):
    structured_support = []
    for item in raw_supports:
        position, magnitude = item
        structured_support.append(models.Support(position, magnitude))
    return structured_support

