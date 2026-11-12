// Accepted public fixture, copied for this read-only design study.
export default {
  "authoring": {
    "appearances": [],
    "assets": [],
    "characters": [
      {
        "defaultAppearanceId": null,
        "dialogueColor": "#ffffff",
        "displayName": "Bec",
        "id": "0327b447-a38c-4e22-bd3b-f2f0f51fcf13",
        "source": {
          "path": "game/definitions/characters.rpy",
          "sourceRevision": "547777c3ec87b24e3a61fccbcb89c390a9a5f573bdaaa8b87ec099c6d75028b1",
          "statement": "define bec = Character(\"Bec\", color=\"#ffffff\")"
        },
        "technicalName": "bec"
      }
    ],
    "projectId": "683c68fd-e3a0-4bab-870a-1e2939739350",
    "schemaVersion": 1,
    "variables": [
      {
        "defaultValue": true,
        "id": "c3f59c6f-288d-4dad-befa-e0f332b68124",
        "source": {
          "path": "game/definitions/variables.rpy",
          "sourceRevision": "8866edf0f661ed7829e17176007bcf1317a1f85dd7a6a6fa573547e7b1da4fd0",
          "statement": "default flag = True"
        },
        "technicalName": "flag",
        "variableType": "bool"
      },
      {
        "defaultValue": false,
        "id": "fd0c6b50-9988-4dcd-a026-e0f70f820099",
        "source": {
          "path": "game/definitions/variables.rpy",
          "sourceRevision": "8866edf0f661ed7829e17176007bcf1317a1f85dd7a6a6fa573547e7b1da4fd0",
          "statement": "default choice_flag = False"
        },
        "technicalName": "choice_flag",
        "variableType": "bool"
      },
      {
        "defaultValue": "0",
        "id": "766ae66d-797a-43eb-ad7a-109c270ec8b5",
        "source": {
          "path": "game/definitions/variables.rpy",
          "sourceRevision": "8866edf0f661ed7829e17176007bcf1317a1f85dd7a6a6fa573547e7b1da4fd0",
          "statement": "default choice_visits = 0"
        },
        "technicalName": "choice_visits",
        "variableType": "int"
      }
    ]
  },
  "authoringRevision": "541b8e29d0b28511f38facb0acae8ca6356ed46a2cd22cef7c3e206fd597a699",
  "canRedo": true,
  "canUndo": false,
  "chapters": [
    {
      "directory": "game/chapters/chapter_01",
      "displayName": "Chapter 1",
      "id": "beebe7e0-6fa9-4cb5-a7d3-a5113968a665"
    }
  ],
  "entrySceneId": "1d39663b-f7e2-4d66-ae02-e9f2d0a7b513",
  "lastOpen": {
    "chapterId": "beebe7e0-6fa9-4cb5-a7d3-a5113968a665",
    "sceneId": "1d39663b-f7e2-4d66-ae02-e9f2d0a7b513"
  },
  "projectRevision": "52729b776d9336cccd37f09b5430ae1d40ba6785c7d4ea25c776cc512e9c43d2",
  "scenes": [
    {
      "beats": [
        {
          "byteEnd": 195,
          "byteStart": 59,
          "id": "feee4a25-fa28-4e51-8ccc-e4e471162461",
          "payload": {
            "options": [
              {
                "id": "24a9772c-2961-48cb-b41d-9c86ce41fbb1",
                "text": "Same"
              },
              {
                "id": "6505faf9-8600-40ae-89cb-66d20aaf3b31",
                "text": "Same"
              },
              {
                "condition": {
                  "expression": {
                    "left": {
                      "type": "variable",
                      "variableId": "fd0c6b50-9988-4dcd-a026-e0f70f820099",
                      "variableType": "bool"
                    },
                    "operator": "equal",
                    "right": {
                      "type": "bool",
                      "value": true
                    },
                    "type": "compare"
                  },
                  "status": "supported"
                },
                "id": "7263f535-1886-4378-938a-7ee30902d93e",
                "text": "Locked",
                "unavailablePolicy": "showDisabled"
              }
            ],
            "pickedPolicy": "hidePicked",
            "prompt": {
              "text": "Choose independently",
              "type": "narration"
            },
            "type": "choice"
          },
          "protected": false
        },
        {
          "byteEnd": 551,
          "byteStart": 195,
          "conditionalBranch": {
            "choiceOption": true,
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
            "ordinal": 0,
            "otherwise": false
          },
          "id": "24a9772c-2961-48cb-b41d-9c86ce41fbb1",
          "payload": {
            "reason": "Unsupported or runtime-dependent Ren'Py source",
            "source": "        \"Same\" (_ll_id=\"24a9772c-2961-48cb-b41d-9c86ce41fbb1\", _ll_available=True, _ll_guarded=False, _ll_locked=False) if (True) and ((\"feee4a25-fa28-4e51-8ccc-e4e471162461\", \"24a9772c-2961-48cb-b41d-9c86ce41fbb1\") not in _ll_picked_v1):",
            "type": "customCode"
          },
          "protected": true
        },
        {
          "byteEnd": 617,
          "byteStart": 551,
          "id": "150b4a6f-42f3-4bca-9d68-456a9d151439",
          "owner": {
            "branchId": "24a9772c-2961-48cb-b41d-9c86ce41fbb1",
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2"
          },
          "payload": {
            "sceneId": "3fd61dc2-e00a-4040-a121-8b8ee45845bc",
            "type": "jump"
          },
          "protected": false
        },
        {
          "byteEnd": 973,
          "byteStart": 617,
          "conditionalBranch": {
            "choiceOption": true,
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
            "ordinal": 1,
            "otherwise": false
          },
          "id": "6505faf9-8600-40ae-89cb-66d20aaf3b31",
          "payload": {
            "reason": "Unsupported or runtime-dependent Ren'Py source",
            "source": "        \"Same\" (_ll_id=\"6505faf9-8600-40ae-89cb-66d20aaf3b31\", _ll_available=True, _ll_guarded=False, _ll_locked=False) if (True) and ((\"feee4a25-fa28-4e51-8ccc-e4e471162461\", \"6505faf9-8600-40ae-89cb-66d20aaf3b31\") not in _ll_picked_v1):",
            "type": "customCode"
          },
          "protected": true
        },
        {
          "byteEnd": 1039,
          "byteStart": 973,
          "id": "69b32d01-a2e4-4dc8-b4ca-15844c0ac56f",
          "owner": {
            "branchId": "6505faf9-8600-40ae-89cb-66d20aaf3b31",
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2"
          },
          "payload": {
            "sceneId": "3fd61dc2-e00a-4040-a121-8b8ee45845bc",
            "type": "jump"
          },
          "protected": false
        },
        {
          "byteEnd": 1781,
          "byteStart": 1039,
          "conditionalBranch": {
            "choiceOption": true,
            "condition": {
              "expression": {
                "left": {
                  "type": "variable",
                  "variableId": "fd0c6b50-9988-4dcd-a026-e0f70f820099",
                  "variableType": "bool"
                },
                "operator": "equal",
                "right": {
                  "type": "bool",
                  "value": true
                },
                "type": "compare"
              },
              "status": "supported"
            },
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
            "ordinal": 2,
            "otherwise": false
          },
          "id": "7263f535-1886-4378-938a-7ee30902d93e",
          "payload": {
            "reason": "Unsupported or runtime-dependent Ren'Py source",
            "source": "        \"Locked\" (_ll_id=\"7263f535-1886-4378-938a-7ee30902d93e\", _ll_available=(choice_flag == True), _ll_guarded=True, _ll_locked=True) if ((\"feee4a25-fa28-4e51-8ccc-e4e471162461\", \"7263f535-1886-4378-938a-7ee30902d93e\") not in _ll_picked_v1) and (((True) and ((\"feee4a25-fa28-4e51-8ccc-e4e471162461\", \"24a9772c-2961-48cb-b41d-9c86ce41fbb1\") not in _ll_picked_v1)) or ((True) and ((\"feee4a25-fa28-4e51-8ccc-e4e471162461\", \"6505faf9-8600-40ae-89cb-66d20aaf3b31\") not in _ll_picked_v1)) or (((choice_flag == True)) and ((\"feee4a25-fa28-4e51-8ccc-e4e471162461\", \"7263f535-1886-4378-938a-7ee30902d93e\") not in _ll_picked_v1))):",
            "type": "customCode"
          },
          "protected": true
        },
        {
          "byteEnd": 1798,
          "byteStart": 1781,
          "id": "d0cb06d3-42f5-4c0a-8956-6860f17ad16a",
          "owner": {
            "branchId": "7263f535-1886-4378-938a-7ee30902d93e",
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2"
          },
          "payload": {
            "reason": "Unsupported or runtime-dependent Ren'Py source",
            "source": "            pass",
            "type": "customCode"
          },
          "protected": true,
          "structuralPlaceholder": true
        },
        {
          "byteEnd": 1816,
          "byteStart": 1798,
          "id": "db78fad2-4d17-4311-8ca8-49cb2cb86141",
          "payload": {
            "text": "Shared once",
            "type": "narration"
          },
          "protected": false
        },
        {
          "byteEnd": 1827,
          "byteStart": 1816,
          "id": "50900405-a9bd-4f74-8b0d-b7eb60c2e03b",
          "payload": {
            "type": "return"
          },
          "protected": false
        }
      ],
      "bodies": [
        {
          "body": {
            "type": "root"
          },
          "kind": "scene",
          "nodes": [
            {
              "beatId": "feee4a25-fa28-4e51-8ccc-e4e471162461",
              "bodies": [
                {
                  "type": "branch",
                  "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
                  "branchId": "24a9772c-2961-48cb-b41d-9c86ce41fbb1"
                },
                {
                  "type": "branch",
                  "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
                  "branchId": "6505faf9-8600-40ae-89cb-66d20aaf3b31"
                },
                {
                  "type": "branch",
                  "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
                  "branchId": "7263f535-1886-4378-938a-7ee30902d93e"
                }
              ]
            },
            {
              "beatId": "db78fad2-4d17-4311-8ca8-49cb2cb86141"
            },
            {
              "beatId": "50900405-a9bd-4f74-8b0d-b7eb60c2e03b"
            }
          ],
          "ending": {
            "type": "ends",
            "beatId": "50900405-a9bd-4f74-8b0d-b7eb60c2e03b"
          },
          "places": [
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "feee4a25-fa28-4e51-8ccc-e4e471162461"
                }
              },
              "fitsEnding": false
            },
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "db78fad2-4d17-4311-8ca8-49cb2cb86141"
                }
              },
              "fitsEnding": false
            },
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "50900405-a9bd-4f74-8b0d-b7eb60c2e03b"
                }
              },
              "fitsEnding": false
            }
          ],
          "defaultPlace": {
            "type": "before",
            "anchor": {
              "type": "beat",
              "beatId": "50900405-a9bd-4f74-8b0d-b7eb60c2e03b"
            }
          }
        },
        {
          "body": {
            "type": "branch",
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
            "branchId": "24a9772c-2961-48cb-b41d-9c86ce41fbb1"
          },
          "kind": "option",
          "number": 1,
          "parent": {
            "type": "root"
          },
          "owningNode": "feee4a25-fa28-4e51-8ccc-e4e471162461",
          "nodes": [
            {
              "beatId": "150b4a6f-42f3-4bca-9d68-456a9d151439"
            }
          ],
          "ending": {
            "type": "ends",
            "beatId": "150b4a6f-42f3-4bca-9d68-456a9d151439"
          },
          "places": [
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "150b4a6f-42f3-4bca-9d68-456a9d151439"
                }
              },
              "fitsEnding": false
            }
          ],
          "defaultPlace": {
            "type": "before",
            "anchor": {
              "type": "beat",
              "beatId": "150b4a6f-42f3-4bca-9d68-456a9d151439"
            }
          }
        },
        {
          "body": {
            "type": "branch",
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
            "branchId": "6505faf9-8600-40ae-89cb-66d20aaf3b31"
          },
          "kind": "option",
          "number": 2,
          "parent": {
            "type": "root"
          },
          "owningNode": "feee4a25-fa28-4e51-8ccc-e4e471162461",
          "nodes": [
            {
              "beatId": "69b32d01-a2e4-4dc8-b4ca-15844c0ac56f"
            }
          ],
          "ending": {
            "type": "ends",
            "beatId": "69b32d01-a2e4-4dc8-b4ca-15844c0ac56f"
          },
          "places": [
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "69b32d01-a2e4-4dc8-b4ca-15844c0ac56f"
                }
              },
              "fitsEnding": false
            }
          ],
          "defaultPlace": {
            "type": "before",
            "anchor": {
              "type": "beat",
              "beatId": "69b32d01-a2e4-4dc8-b4ca-15844c0ac56f"
            }
          }
        },
        {
          "body": {
            "type": "branch",
            "groupId": "205331a6-7d87-45aa-addc-1c476d498be2",
            "branchId": "7263f535-1886-4378-938a-7ee30902d93e"
          },
          "kind": "option",
          "number": 3,
          "parent": {
            "type": "root"
          },
          "owningNode": "feee4a25-fa28-4e51-8ccc-e4e471162461",
          "nodes": [],
          "ending": {
            "type": "continues"
          },
          "places": [
            {
              "position": {
                "type": "end"
              },
              "fitsEnding": true
            }
          ],
          "defaultPlace": {
            "type": "end"
          }
        }
      ],
      "chapterId": "beebe7e0-6fa9-4cb5-a7d3-a5113968a665",
      "displayName": "Scene 1",
      "id": "1d39663b-f7e2-4d66-ae02-e9f2d0a7b513",
      "partial": false,
      "sourceConflict": false,
      "sourcePath": "game/chapters/chapter_01/scene_001.rpy",
      "sourceRevision": "9e818fc5dec86fb1308a9bd26bd87b492138822c3adb7c8a0c83c17e5cb5a04c",
      "technicalLabel": "loomlight_scene_1d39663bf7e24d66ae02e9f2d0a7b513"
    },
    {
      "beats": [
        {
          "byteEnd": 77,
          "byteStart": 56,
          "id": "c6628839-ffa7-449c-8110-750f0360e113",
          "payload": {
            "text": "Reenter Choice",
            "type": "narration"
          },
          "protected": false
        },
        {
          "byteEnd": 135,
          "byteStart": 77,
          "id": "0d3d3354-4728-4392-ba63-97b3d5204275",
          "payload": {
            "sceneId": "1d39663b-f7e2-4d66-ae02-e9f2d0a7b513",
            "type": "jump"
          },
          "protected": false
        }
      ],
      "bodies": [
        {
          "body": {
            "type": "root"
          },
          "kind": "scene",
          "nodes": [
            {
              "beatId": "c6628839-ffa7-449c-8110-750f0360e113"
            },
            {
              "beatId": "0d3d3354-4728-4392-ba63-97b3d5204275"
            }
          ],
          "ending": {
            "type": "ends",
            "beatId": "0d3d3354-4728-4392-ba63-97b3d5204275"
          },
          "places": [
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "c6628839-ffa7-449c-8110-750f0360e113"
                }
              },
              "fitsEnding": false
            },
            {
              "position": {
                "type": "before",
                "anchor": {
                  "type": "beat",
                  "beatId": "0d3d3354-4728-4392-ba63-97b3d5204275"
                }
              },
              "fitsEnding": false
            }
          ],
          "defaultPlace": {
            "type": "before",
            "anchor": {
              "type": "beat",
              "beatId": "0d3d3354-4728-4392-ba63-97b3d5204275"
            }
          }
        }
      ],
      "chapterId": "beebe7e0-6fa9-4cb5-a7d3-a5113968a665",
      "displayName": "Transfer target",
      "id": "3fd61dc2-e00a-4040-a121-8b8ee45845bc",
      "partial": false,
      "sourceConflict": false,
      "sourcePath": "game/chapters/chapter_01/scene_002.rpy",
      "sourceRevision": "9263332ebdf2e4b08d386fa1c924eb093d04672d7cef070b79d7b2bef5cf9ebe",
      "technicalLabel": "loomlight_scene_3fd61dc2e00a4040a1218b8ee45845bc"
    }
  ],
  "sourceMapRevision": "a890c861d8bbb57e8c5ece72cfe7a2d0f328cecb998c785e4d9bb9d5ac71b95e"
};
