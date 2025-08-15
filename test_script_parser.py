#!/usr/bin/env python3
"""
대본 파싱 시스템 테스트 스크립트
TASK.md 예제를 기반으로 ScriptParser 클래스 기능을 테스트합니다.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.script_parser import ScriptParser, ScriptParsingError


def create_test_script_content():
    """테스트용 대본 콘텐츠 생성"""
    return """
=== 대본 ===
안녕하세요, 시청자 여러분! 오늘은 60년 만에 처음 공개하는 할머니의 숨겨진 이야기를 들려드리려고 합니다.

1960년대 초, 아직 어린 신부였던 할머니는 시댁 살이가 힘들어 몰래 친정에 편지를 썼습니다. 
하지만 그 편지는 시어머니에게 발각되고 말았죠. 

그날 밤, 할머니는 혼자 마당에 앉아 눈물을 흘리며 다짐했습니다.
"언젠가 내 손주들에게는 이런 마음의 짐을 주지 않겠다."

그 약속을 지키기 위해 할머니가 선택한 방법은 무엇이었을까요?
오늘 영상에서 그 감동적인 이야기를 공개합니다.

=== 메타데이터 ===
제목: 60년 만에 밝히는 할머니의 비밀 - 시댁살이 고충과 가족 사랑
설명: 1960년대 어린 신부였던 할머니의 진솔한 이야기를 통해 그 시대 여성들의 삶과 가족에 대한 깊은 사랑을 느껴보세요. 
현재를 살아가는 시니어 세대에게 위로와 공감을 전하는 따뜻한 영상입니다.
태그: 시니어, 할머니, 1960년대, 가족, 시댁살이, 회상, 감동, 한국사, 여성사

=== 썸네일 제작 ===
텍스트: 60년 만에 공개하는 할머니의 비밀
ImageFX 프롬프트: 1960년대 한국의 전통 한옥 마당에서 한복을 입은 젊은 여성이 달빛 아래 혼자 앉아 편지를 읽고 있는 따뜻하고 감성적인 장면, 빈티지 톤, 따뜻한 조명
"""


def test_basic_parsing():
    """기본 파싱 기능 테스트"""
    print("=" * 50)
    print("🧪 기본 파싱 기능 테스트")
    print("=" * 50)
    
    parser = ScriptParser()
    test_content = create_test_script_content()
    
    try:
        result = parser.parse_script_file(test_content)
        
        print("✅ 파싱 성공!")
        print("\n📄 파싱 결과:")
        for key, value in result.items():
            print(f"• {key}: {value[:100]}..." if len(str(value)) > 100 else f"• {key}: {value}")
        
        return result
    except ScriptParsingError as e:
        print(f"❌ 파싱 실패: {e}")
        return None


def test_validation():
    """데이터 유효성 검증 테스트"""
    print("\n" + "=" * 50)
    print("🔍 데이터 유효성 검증 테스트")
    print("=" * 50)
    
    parser = ScriptParser()
    
    # 정상 데이터 테스트
    valid_data = {
        'content': '테스트 대본 내용',
        'title': '테스트 제목',
        'description': '테스트 설명',
        'tags': '테스트, 태그'
    }
    
    is_valid = parser.validate_parsed_data(valid_data)
    print(f"✅ 정상 데이터 검증: {'통과' if is_valid else '실패'}")
    
    # 필수 필드 누락 테스트
    invalid_data = {
        'description': '설명만 있음',
        'tags': '태그만, 있음'
    }
    
    is_valid = parser.validate_parsed_data(invalid_data)
    print(f"❌ 필수 필드 누락 검증: {'통과' if not is_valid else '실패'}")
    
    # 제목 길이 초과 테스트
    long_title_data = {
        'content': '내용',
        'title': 'A' * 101,  # 101자 제목
        'description': '설명'
    }
    
    is_valid = parser.validate_parsed_data(long_title_data)
    print(f"📏 제목 길이 초과 검증: {'통과' if not is_valid else '실패'}")


def test_error_handling():
    """에러 처리 테스트"""
    print("\n" + "=" * 50)
    print("⚠️  에러 처리 테스트")
    print("=" * 50)
    
    parser = ScriptParser()
    
    # 빈 내용 테스트
    try:
        parser.parse_script_file("")
        print("❌ 빈 내용 에러 처리 실패")
    except ScriptParsingError:
        print("✅ 빈 내용 에러 처리 성공")
    
    # 대본 섹션 없음 테스트
    try:
        parser.parse_script_file("=== 메타데이터 ===\n제목: 테스트")
        print("❌ 대본 섹션 없음 에러 처리 실패")
    except ScriptParsingError:
        print("✅ 대본 섹션 없음 에러 처리 성공")
    
    # 제목 없음 테스트
    try:
        parser.parse_script_file("=== 대본 ===\n테스트 내용\n=== 메타데이터 ===\n설명: 설명만")
        print("❌ 제목 없음 에러 처리 실패")
    except ScriptParsingError:
        print("✅ 제목 없음 에러 처리 성공")


def test_edge_cases():
    """경계 케이스 테스트"""
    print("\n" + "=" * 50)
    print("🔬 경계 케이스 테스트")
    print("=" * 50)
    
    parser = ScriptParser()
    
    # 최소한의 정보만 있는 케이스
    minimal_content = """
=== 대본 ===
최소한의 대본 내용입니다.

=== 메타데이터 ===
제목: 최소 제목
"""
    
    try:
        result = parser.parse_script_file(minimal_content)
        print("✅ 최소한 정보 파싱 성공")
        print(f"   제목: {result.get('title')}")
        print(f"   내용: {result.get('content')}")
    except Exception as e:
        print(f"❌ 최소한 정보 파싱 실패: {e}")
    
    # 공백이 많은 케이스
    whitespace_content = """

    === 대본 ===
    
    
    공백이 많은 대본 내용입니다.
    
    
    === 메타데이터 ===
    
    제목   :   공백 테스트 제목   
    설명   :   공백이 많은 설명입니다   
    태그   :   공백 , 테스트 , 태그   
    
    """
    
    try:
        result = parser.parse_script_file(whitespace_content)
        print("✅ 공백 처리 테스트 성공")
        print(f"   제목: '{result.get('title')}'")
        print(f"   태그: '{result.get('tags')}'")
    except Exception as e:
        print(f"❌ 공백 처리 테스트 실패: {e}")


def main():
    """메인 테스트 실행"""
    print("🎬 YouTube Upload Automation - 대본 파싱 시스템 테스트")
    print("=" * 60)
    
    # 기본 파싱 테스트
    parsed_result = test_basic_parsing()
    
    # 유효성 검증 테스트
    test_validation()
    
    # 에러 처리 테스트
    test_error_handling()
    
    # 경계 케이스 테스트
    test_edge_cases()
    
    print("\n" + "=" * 60)
    print("🏁 모든 테스트 완료!")
    
    if parsed_result:
        print("\n📊 파싱된 데이터 상세:")
        print("-" * 30)
        for key, value in parsed_result.items():
            print(f"{key:20}: {value}")


if __name__ == "__main__":
    main()